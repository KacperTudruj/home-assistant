# Konfiguracja Kamery Aqara G2H Pro

Ten dokument opisuje kroki niezbędne do integracji i wyświetlania obrazu z kamery Aqara G2H Pro w Twojej aplikacji.

## 1. Aktywacja strumienia RTSP (Lokalnie)
Kamera G2H Pro nie ma domyślnie włączonego protokołu RTSP w ustawieniach. Musisz go odblokować fizycznie:

1. Otwórz aplikację **Aqara Home** na telefonie.
2. Wejdź w podgląd na żywo z kamery G2H Pro.
3. Kliknij fizyczny przycisk resetu na spodzie kamery **10 razy pod rząd** (szybko).
4. Kamera powinna wydać komunikat głosowy potwierdzający aktywację trybu RTSP.
5. Adres strumienia będzie wyglądał następująco: `rtsp://<IP_KAMERY>:554/live/ch0`
   - *Uwaga: Możesz sprawdzić działanie strumienia w programie VLC przed dalszą konfiguracją.*

## 2. Konfiguracja Serwera (Mostek Wideo)
Przeglądarki internetowe nie wspierają protokołu RTSP. Aby wyświetlić obraz w aplikacji, potrzebujesz "tłumacza" (proxy). Rekomendowane rozwiązanie to **go2rtc**.

### Dodaj do `docker-compose.yml`:
```yaml
services:
  go2rtc:
    image: alexxit/go2rtc
    container_name: go2rtc
    network_mode: host # Ważne dla RTSP w sieci lokalnej
    restart: always
    volumes:
      - ./go2rtc.yaml:/config/go2rtc.yaml
```

### Utwórz plik `go2rtc.yaml`:
```yaml
streams:
  kamera_salon: rtsp://<IP_KAMERY>:554/live/ch0
```

## 3. Wyświetlanie w aplikacji
Po uruchomieniu `go2rtc`, obraz będzie dostępny przez WebRTC lub MSE. W aplikacji możesz użyć:

- **WebRTC (najniższe opóźnienie):** Przez bibliotekę JS od go2rtc.
- **HLS/MSE:** Prosty tag `<video src="http://<IP_SERWERA>:1984/api/stream.mp4?src=kamera_salon">`.

## 4. Dalsze plany projektowe
Aby w pełni zintegrować Aqara z tym projektem, sugeruję następujące kroki:

- [ ] **Moduł Smart Home:** Stworzenie dedykowanego modułu `smart-home` (zamiast upychania wszystkiego w `smart-agd`), który będzie agregował sensory (temperatura, wilgotność, zalanie).
- [ ] **Dashboard Wideo:** Dodanie nowego widoku w `src/pages` (np. `camera.html`) z odtwarzaczem wideo skonfigurowanym pod `go2rtc`.
- [ ] **Synchronizacja Konfiguracji:** Stworzenie UI do zarządzania danymi w tabeli `SystemConfigurationSmartAgd`, abyś nie musiał edytować bazy ręcznie przy zmianie API Key.
- [ ] **Obsługa Sensorów:** Implementacja UseCase'u pobierającego temperaturę i wilgotność z Aqary i wyświetlanie ich na głównym dashboardzie.

## 5. Dane dostępowe (Open API)
Pamiętaj, aby w tabeli `SystemConfigurationSmartAgd` uzupełnić:
- `aqara_app_id`
- `aqara_app_key`
- `aqara_key_id`
- `aqara_region` (np. `eu`)
