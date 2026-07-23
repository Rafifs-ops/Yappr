import jwt from "jsonwebtoken";
import { User } from "../models/User.schema";

// mengambil session
export const session = async (event: any) => {
    let token = getCookie(event, 'auth_token');
    const refreshTokenCookie = getCookie(event, 'refresh_token');

    // mengambil JWT Secret dari environment variable
    const config = useRuntimeConfig();
    const secretAuthKey = config.jwtSecret;
    if (!secretAuthKey) {
        throw createError({
            statusCode: 500,
            message: 'JWT Secret is not defined in runtime config'
        });
    }

    if (!token && !refreshTokenCookie) {
        console.error('Session Error: No token and no refresh token cookie');
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    let decodedToken: any = null;

    if (token) {
        try {
            decodedToken = jwt.verify(token, secretAuthKey as string) as any;
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                decodedToken = null; // Let it fallback to refresh token
            } else {
                console.error('Session Error: Token invalid', error);
                throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
            }
        }
    }

    if (!decodedToken && refreshTokenCookie) {
        try {
            const decodedRefresh = jwt.verify(refreshTokenCookie, secretAuthKey as string) as any;
            const user = await User.findById(decodedRefresh.userId);
            
            if (!user) {
                console.error('Session Error: User not found for refresh token');
                throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
            }
            if (user.refreshToken !== refreshTokenCookie) {
                console.error('Session Error: Refresh token mismatch. DB:', user.refreshToken, 'Cookie:', refreshTokenCookie);
                throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
            }

            // Issue new access token and rotate refresh token
            const payload = { userId: user._id.toString() };
            token = jwt.sign(payload, secretAuthKey as string, { expiresIn: '15m' });
            const newRefreshToken = jwt.sign(payload, secretAuthKey as string, { expiresIn: '7d' });
            
            user.refreshToken = newRefreshToken;
            await user.save();
            
            setCookie(event, 'auth_token', token, {
                maxAge: 60 * 15,  // 15 menit
                httpOnly: true,
                secure: true,
                path: '/',
            });

            setCookie(event, 'refresh_token', newRefreshToken, {
                maxAge: 60 * 60 * 24 * 7,  // 7 hari
                httpOnly: true,
                secure: true,
                path: '/',
            });

            decodedToken = payload;
        } catch (error) {
            console.error('Session Error: Refresh token verification failed', error);
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
        }
    }

    if (!decodedToken) {
        console.error('Session Error: No decoded token available');
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    try {
        const user = await User.findById(decodedToken.userId);
        if (!user) throw new Error();

        return {
            id: user._id.toString(),
            username: user.username,
            photo: user.photo,
            email: user.email,
            bio: user.bio,
        }
    } catch (error) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
}