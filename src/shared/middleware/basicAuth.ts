import { Request, Response, NextFunction } from 'express';

export const basicAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Home Assistant"');
        return res.status(401).json({ message: 'Authentication required' });
    }

    const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    const user = auth[0];
    const pass = auth[1];

    const expectedUser = process.env.BASIC_AUTH_USER;
    const expectedPass = process.env.BASIC_AUTH_PASSWORD;

    if (user === expectedUser && pass === expectedPass) {
        return next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Home Assistant"');
        return res.status(401).json({ message: 'Invalid credentials' });
    }
};
