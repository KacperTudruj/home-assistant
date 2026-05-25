# Lokalna Integracja Zigbee w Ekosystemie Smart Home

Ten dokument opisuje konfigurację w 100% lokalnego środowiska Zigbee przy użyciu Zigbee2MQTT, brokera Mosquitto oraz Twojego backendu (Symfony).

## 1. Konfiguracja Infrastruktury (Docker)

W pliku `docker-compose.yml` sekcja usług dla MQTT i Zigbee powinna wyglądać następująco. Zwróć szczególną uwagę na mapowanie urządzeń USB (`devices`).

```yaml
services:
  # Broker wiadomości MQTT
  mosquitto:
    image: eclipse-mosquitto:latest
    container_name: mosquitto
    restart: unless-stopped
    ports:
      - "1883:1883"     # Standardowy port MQTT
      - "9001:9001"     # WebSocket (dla dashboardów www)
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
      - ./mosquitto/log:/mosquitto/log

  # Most Zigbee <-> MQTT
  zigbee2mqtt:
    container_name: zigbee2mqtt
    image: koenkk/zigbee2mqtt:latest
    restart: unless-stopped
    depends_on:
      - mosquitto
    volumes:
      - ./zigbee2mqtt-data:/app/data
      - /run/udev:/run/udev:ro
    ports:
      - "8099:8099" # Panel WWW Zigbee2MQTT
    environment:
      - TZ=Europe/Warsaw
    devices:
      # Mapowanie koordynatora USB z hosta do stałego portu w kontenerze
      # Ścieżka na hoście jest brana ze zmiennej ZIGBEE_DEVICE w .env
      - ${ZIGBEE_DEVICE:-/dev/ttyACM0}:/dev/ttyACM0 
    profiles:
      - zigbee # Pozwala na opcjonalne uruchomienie usługi
```

### Konfiguracja Środowiskowa (.env)

Domyślnie moduł Zigbee jest **wyłączony**, aby uniknąć błędów startu systemu, gdy koordynator USB nie jest podłączony. Aby go aktywować, dodaj lub edytuj poniższe linie w pliku `.env` lub `.env.local`:

```env
# Aktywacja profilu Zigbee
COMPOSE_PROFILES=zigbee

# Ścieżka do urządzenia na hoście (sprawdź przez: ls /dev/ttyACM* lub ls /dev/ttyUSB*)
ZIGBEE_DEVICE=/dev/ttyACM0
```

Jeśli na Twoim środowisku (np. beta) nie ma koordynatora, pozostaw `COMPOSE_PROFILES=` pusty. Zapobiegnie to błędowi `no such file or directory` podczas deployu.

---

## 2. Konfiguracja Zigbee2MQTT

Główny plik konfiguracyjny znajduje się w `./zigbee2mqtt-data/configuration.yaml`. Kluczowe jest poprawne wskazanie adresu brokera w sieci Dockera oraz włączenie interfejsu graficznego.

```yaml
# zigbee2mqtt-data/configuration.yaml
homeassistant: false # Wyłączone, bo budujemy własny system
permit_join: false   # Zmieniaj na true tylko podczas parowania

mqtt:
  base_topic: zigbee2mqtt
  server: mqtt://mosquitto:1883 # Adres kontenera Mosquitto

serial:
  port: /dev/ttyACM0 # Musi odpowiadać mapowaniu w docker-compose

frontend:
  enabled: true
  port: 8099

advanced:
  network_key: GENERATE # Zigbee2MQTT wygeneruje bezpieczny klucz przy pierwszym starcie
  pan_id: GENERATE
  ext_pan_id: GENERATE
  channel: 11
```

---

## 3. Integracja z Backendem (Symfony)

Aby Twój backend w Symfony mógł komunikować się z Zigbee, zalecamy architekturę opartą na zdarzeniach (Event-Driven).

### Sugerowane biblioteki
- **`php-mqtt/client`**: Najstabilniejsza biblioteka PHP do obsługi MQTT.
- **`symfony/messenger`**: Do asynchronicznego procesowania otrzymanych danych.

### Architektura Obsługi Danych
1. **MQTT Consumer Command**: Tworzysz komendę Symfony (`Command`), która działa w pętli nieskończonej (uruchamiana jako demon przez np. Supervisora).
2. **MessageHandler**: Dane z MQTT są dekodowane i wysyłane na szynę (Message Bus), gdzie dedykowane Handlery zajmują się logiką biznesową (np. zapisem do bazy).

### Przykład implementacji (Consumer Command)

```php
// src/Command/ZigbeeMqttConsumerCommand.php

namespace App\Command;

use PhpMqtt\Client\MqttClient;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Messenger\MessageBusInterface;
use App\Message\ZigbeeSensorUpdate;

class ZigbeeMqttConsumerCommand extends Command
{
    protected static $defaultName = 'app:mqtt:consume';

    public function __construct(
        private string $mqttHost,
        private MessageBusInterface $bus
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $mqtt = new MqttClient($this->mqttHost, 1883, 'symfony-backend');
        $mqtt->connect();

        $output->writeln("Subskrybowanie tematów Zigbee...");

        // Subskrypcja na wszystkie urządzenia (+ to wildcard dla device_id)
        $mqtt->subscribe('zigbee2mqtt/+', function (string $topic, string $message) {
            $data = json_decode($message, true);
            $deviceId = str_replace('zigbee2mqtt/', '', $topic);

            // Wysyłamy wiadomość na szynę Symfony Messenger
            $this->bus->dispatch(new ZigbeeSensorUpdate($deviceId, $data));
        });

        $mqtt->loop(true);

        return Command::SUCCESS;
    }
}
```

**Oczekiwane dane JSON:**
Dla czujnika temperatury (np. Aqara), temat to zazwyczaj `zigbee2mqtt/NAZWA_URZADZENIA`, a payload to:
```json
{
  "battery": 100,
  "humidity": 45.2,
  "linkquality": 120,
  "pressure": 1012,
  "temperature": 22.5
}
```

---

## Bonus: Integracja z obecnym modułem Node.js (TypeScript)

W Twoim aktualnym projekcie integracja jest już częściowo przygotowana w warstwie `shared/connectors/mqtt`. Możesz z niej skorzystać następująco:

```typescript
// Przykład użycia MqttJsClient w Node.js
const mqttClient = new MqttJsClient(mqttConfigRepo);

await mqttClient.subscribe('zigbee2mqtt/+', (message) => {
    const data = JSON.parse(message.payload.toString());
    console.log(`Otrzymano dane z urządzenia: ${message.topic}`, data);
});
```

---

## 4. Workflow Parowania Urządzeń

1. **Uruchomienie frontendu**: Wejdź w przeglądarce na `http://localhost:8099`.
2. **Włączenie parowania**: Kliknij przycisk **"Permit join (All)"** w górnym menu panelu. Masz teraz czas na sparowanie fizycznych urządzeń.
3. **Reset urządzenia**: Na urządzeniu Zigbee (np. czujniku Aqara) przytrzymaj przycisk resetu przez ok. 5 sekund, aż dioda zacznie migać.
4. **Wykrycie**: W panelu Zigbee2MQTT powinieneś zobaczyć nowe urządzenie. Możesz nadać mu przyjazną nazwę (Friendly Name), np. `salon_temp`.
5. **MQTT**: Od tego momentu urządzenie będzie wysyłać dane na temat `zigbee2mqtt/salon_temp`.
6. **Wyłączenie parowania**: Po zakończeniu parowania kliknij **"Disable permit join"** ze względów bezpieczeństwa.
