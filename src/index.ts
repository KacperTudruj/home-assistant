import express from 'express';
import path from 'path';
import {PrismaClient} from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config(); // Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true }); // Load .env.local if exists

import swaggerUi from 'swagger-ui-express';
import {swaggerSpec} from './docs/openapi';

import {CommentaryRepositoryPrisma} from '@modules/commentary/infrastructure/CommentaryRepositoryPrisma';

import {CommentaryPresenter} from './modules/commentary/domain/CommentaryPresenter';
import {GetCommentaryForFeatureUseCase} from './modules/commentary/application/GetCommentaryUseCase';
import {CreateCommentaryUseCase} from './modules/commentary/application/CreateCommentaryUseCase';
import {CommentaryController} from './modules/commentary/interface/CommentaryController';
import {CommentatorRepositoryPrisma} from '@modules/commentary/infrastructure/CommentatorRepositoryPrisma';
import {ListCommentatorsUseCase} from '@modules/commentary/application/ListCommentatorsUseCase';
import {FeatureController} from '@modules/features/interface/FeatureController';
import {ListFeaturesUseCase} from '@modules/features/application/ListFeaturesUseCase';
import {FeaturesRepositoryPrisma} from '@modules/features/infrastructure/FeaturesRepositoryPrisma';
import {featureRoutes} from '@modules/features/interface/FeatureRoutes';
import {CommentaryRoutes} from '@modules/commentary/interface/CommentaryRoutes';
import {CarRoutes} from '@modules/car/interface/CarRoutes';
import {CarController} from '@modules/car/interface/CarController';
import {FuelController} from '@modules/car/interface/FuelController';
import {ServiceController} from '@modules/car/interface/ServiceController';
import {GetFuelStatisticsUseCase} from '@modules/car/application/GetFuelStatisticsUseCase';

// Shared Connectors
import {SmartThingsHttpClient} from './shared/connectors/smartthings/infrastructure/SmartThingsHttpClient';
import {
    SmartThingsConfigRepositoryPrisma
} from './shared/connectors/smartthings/infrastructure/SmartThingsConfigRepositoryPrisma';

// AGD Module
import {GetAgdDevicesUseCase} from '@modules/smart-agd/application/GetAgdDevicesUseCase';
import {AgdController} from '@modules/smart-agd/interface/AgdController';
import {AgdRoutes} from '@modules/smart-agd/interface/AgdRoutes';
import {SmartThingsAgdAdapter} from '@modules/smart-agd/infrastructure/SmartThingsAgdAdapter';
import {AqaraConfigRepositoryPrisma} from './shared/connectors/aqara/infrastructure/AqaraConfigRepositoryPrisma';
import {AqaraHttpClient} from './shared/connectors/aqara/infrastructure/AqaraHttpClient';
import {AqaraAgdAdapter} from '@modules/smart-agd/infrastructure/AqaraAgdAdapter';
import {CompositeAgdProvider} from '@modules/smart-agd/domain/CompositeAgdProvider';
import {basicAuth} from './shared/middleware/basicAuth';

// Smart Home Module
import {GetSmartHomeDevicesUseCase} from '@modules/smart-home/application/GetSmartHomeDevicesUseCase';
import {UpdateCameraLabelUseCase} from '@modules/smart-home/application/UpdateCameraLabelUseCase';
import {Go2RtcSmartHomeAdapter} from '@modules/smart-home/infrastructure/Go2RtcSmartHomeAdapter';
import {AqaraSmartHomeAdapter} from '@modules/smart-home/infrastructure/AqaraSmartHomeAdapter';
// import {ZigbeeMqttSmartHomeAdapter} from '@modules/smart-home/infrastructure/ZigbeeMqttSmartHomeAdapter';
import {CompositeSmartHomeProvider} from '@modules/smart-home/domain/CompositeSmartHomeProvider';
import {MqttConfigRepositoryPrisma} from './shared/connectors/mqtt/infrastructure/MqttConfigRepositoryPrisma';
// import {MqttJsClient} from './shared/connectors/mqtt/infrastructure/MqttJsClient';
import {SmartHomeController} from '@modules/smart-home/interface/SmartHomeController';
import {SmartHomeRoutes} from '@modules/smart-home/interface/SmartHomeRoutes';

const app = express();
const PORT = 3000;
const PAGES_DIR = path.join(__dirname, '..', 'src', 'pages');

app.use(express.json());
app.use(basicAuth);

// swagger
app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);
// static
app.use(express.static(path.join(__dirname, '..', 'public')));

// pages
app.get('/', (_, res) => {
    res.sendFile(path.join(PAGES_DIR, 'home.html'));
});

app.get('/car-log', (_, res) => {
    res.sendFile(path.join(PAGES_DIR, 'car-log.html'));
});
app.get('/smart-agd', (_, res) => {
    res.sendFile(path.join(PAGES_DIR, 'smart-agd.html'));
});
app.get('/camera', (_, res) => {
    res.sendFile(path.join(PAGES_DIR, 'camera.html'));
});

// ===== COMPOSITION ROOT =====
const prisma = new PrismaClient();

const commentaryRepo = new CommentaryRepositoryPrisma(prisma);
const narratorRepo = new CommentatorRepositoryPrisma(prisma);
const presenter = new CommentaryPresenter();
const getCommentaryForFeatureUseCase =
    new GetCommentaryForFeatureUseCase(
        commentaryRepo,
        narratorRepo,
        presenter
    );

const createCommentaryUseCase = new CreateCommentaryUseCase(commentaryRepo);
const listCommentatorsUseCase = new ListCommentatorsUseCase(narratorRepo);
const commentaryController = new CommentaryController(
    getCommentaryForFeatureUseCase,
    createCommentaryUseCase,
    listCommentatorsUseCase
);

const featuresRepo = new FeaturesRepositoryPrisma(prisma);
const listFeaturesUseCase = new ListFeaturesUseCase(featuresRepo);
const featureController = new FeatureController(listFeaturesUseCase);
const carController = new CarController();
const fuelStatisticsUseCase = new GetFuelStatisticsUseCase(prisma);
const fuelController = new FuelController(fuelStatisticsUseCase);
const serviceController = new ServiceController();

// --- SmartThings Connector (Shared Kernel) ---
const stConfigRepo = new SmartThingsConfigRepositoryPrisma(prisma);
const stClient = new SmartThingsHttpClient(stConfigRepo, () => {
    console.log('ALARM: SmartThings token expired! Update it in SystemConfiguration table.');
});

// --- Aqara Connector (Shared Kernel) ---
const aqaraConfigRepo = new AqaraConfigRepositoryPrisma(prisma);
const aqaraClient = new AqaraHttpClient(aqaraConfigRepo);

// --- MQTT Connector (Shared Kernel) ---
const mqttConfigRepo = new MqttConfigRepositoryPrisma(prisma);
// const mqttClient = new MqttJsClient(mqttConfigRepo);

// --- AGD Module ---
const stAgdProvider = new SmartThingsAgdAdapter(stClient);
const aqaraAgdProvider = new AqaraAgdAdapter(aqaraClient);
const compositeAgdProvider = new CompositeAgdProvider([stAgdProvider, aqaraAgdProvider]);

const getAgdDevicesUseCase = new GetAgdDevicesUseCase(compositeAgdProvider);
const agdController = new AgdController(getAgdDevicesUseCase);

// --- Smart Home Module ---
const go2rtcSmartHomeProvider = new Go2RtcSmartHomeAdapter(prisma);
const aqaraSmartHomeProvider = new AqaraSmartHomeAdapter(aqaraClient);
// const zigbeeMqttSmartHomeProvider = new ZigbeeMqttSmartHomeAdapter(mqttClient);

const compositeSmartHomeProvider = new CompositeSmartHomeProvider([
    go2rtcSmartHomeProvider,
    aqaraSmartHomeProvider,
    // zigbeeMqttSmartHomeProvider
]);

const getSmartHomeDevicesUseCase = new GetSmartHomeDevicesUseCase(compositeSmartHomeProvider);
const updateCameraLabelUseCase = new UpdateCameraLabelUseCase(compositeSmartHomeProvider);
const smartHomeController = new SmartHomeController(getSmartHomeDevicesUseCase, updateCameraLabelUseCase);
// ===== END COMPOSITION ROOT =====

// ===== ROUTES =====
// commentary
app.use('/api', CommentaryRoutes(commentaryController));
app.use('/api', featureRoutes(featureController));
app.use('/api', CarRoutes(carController, fuelController, serviceController));
app.use('/api', AgdRoutes(agdController));
app.use('/api', SmartHomeRoutes(smartHomeController));


// health check
app.get('/api/health', (_, res) => {
    res.json({status: 'ok'});
});

// start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('Jamnik Henryk uruchomi system');
});