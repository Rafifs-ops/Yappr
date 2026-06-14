import jwt from "jsonwebtoken";
import { User } from "../models/User.schema";

// mengambil session
export const session = async (event: any) => {
    let token = getCookie(event, 'auth_token');
    const refreshTokenCookie = getCookie(event, 'refresh_token');

    // mengambil JWT Secret dari environment variable
    const secretAuthKey = process.env.JWT_SECRET;
    if (!secretAuthKey) {
        throw createError({
            statusCode: 500,
            message: 'JWT Secret is not defined in runtime config'
        });
    }

    if (!token && !refreshTokenCookie) {
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
                throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
            }
        }
    }

    if (!decodedToken && refreshTokenCookie) {
        try {
            const decodedRefresh = jwt.verify(refreshTokenCookie, secretAuthKey as string) as any;
            const user = await User.findById(decodedRefresh.userId);
            
            if (!user || user.refreshToken !== refreshTokenCookie) {
                throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
            }

            // Issue new access token
            const payload = { userId: user._id.toString() };
            token = jwt.sign(payload, secretAuthKey as string, { expiresIn: '15m' });
            
            setCookie(event, 'auth_token', token, {
                maxAge: 60 * 15,  // 15 menit
                httpOnly: true,
                secure: true,
            });

            decodedToken = payload;
        } catch (error) {
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
        }
    }

    if (!decodedToken) {
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