import 'express';

declare global {
    namespace Express {
        interface Request {
            file?: import('multer').File;
            files?: import('multer').File[];
        }
    }
}

export {};
