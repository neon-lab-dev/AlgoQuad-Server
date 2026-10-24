/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from 'jsonwebtoken';

export const createToken = (jwtPayload : {name:string, email:string, phoneNumber:string, role:string, profilePicture:string}, secret:any, expiresIn:any) => {
    return jwt.sign(jwtPayload, secret, {expiresIn});
};