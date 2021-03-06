import { NextFunction, Request, Response } from "express";
import UserRepository from "../../repositories/UserRepository";
import Controller from "../../typings/Controller";
import {
  COOKIES_OPTIONS,
  generateRefreshToken,
  generateToken,
} from "../../utils/generateToken";
import { GoogleStrategy } from "./authentication/strategies/GoogleStrategy";
import { LocalValidation } from "./authentication/strategies/LocalStrategy";
import { AuthRequest } from "./authentication/AuthRequest";
import { FacebookStrategy } from "./authentication/strategies/FacebookStrategy";
import { routeConfig } from "../../middlewares/routeConfig";
import { refreshTokenProtected, userProtected } from "../../middlewares/authMiddleware";
import { requestLog } from "../../middlewares/requestLog";

class AuthController extends Controller {
  @requestLog()
  @routeConfig({ method: "post", path: "/api/user/auth" + "/login" })
  async login(req: Request, res: Response, _: NextFunction): Promise<any> {
    try {
      const { email, password } = req.body;
      const request = new AuthRequest(new LocalValidation(email, password));

      const user = await request.verify();

      if (!user) {
        return res.status(401).json("UnAuthorized");
      }

      res.cookie("refresh_token", user.refreshToken, COOKIES_OPTIONS);

      super.sendSuccess(200, res, null);
      // this.logger.info`${req.method}${req.originalUrl}${res.statusCode}`;
    } catch (error) {
      console.log(error);
      super.sendError(500, res);
    }
  }

  @requestLog()
  @routeConfig({ method: "get", path: "/api/user/auth" + "/login/google" })
  async google(_: Request, res: Response, __: NextFunction): Promise<any> {
    const scope = [
      "https%3A//www.googleapis.com/auth/userinfo.email",
      "https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile",
    ];
    const redirect_uri =
      "https://localhost:5001/api/user/auth/login/google/callback";

    res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?scope=${scope.join(
        "+"
      )}&access_type=offline&include_granted_scopes=true&response_type=code&state=state_parameter_passthrough_value&redirect_uri=${redirect_uri}&client_id=${process.env.GOOGLE_CLIENT_ID
      }`
    );
  }

  @requestLog()
  @routeConfig({ method: "get", path: "/api/user/auth" + "/login/google/callback" })
  async googleCallback(
    req: Request,
    res: Response,
    _: NextFunction
  ): Promise<any> {
    try {
      const { code } = req.query;
      const request = new AuthRequest(new GoogleStrategy(code as string));
      const user = await request.verify();

      if (user) {
        res.cookie("refresh_token", user.refreshToken, COOKIES_OPTIONS);
      }

      return res.redirect("https://localhost:3001");
    } catch (error) {
      console.log(error);
      return res.redirect("https://localhost:3001");
    }
  }

  @requestLog()
  @routeConfig({ method: "get", path: "/api/user/auth" + "/login/facebook" })
  async facebook(req: Request, res: Response, __: NextFunction): Promise<any> {
    const redirect_uri = `https://localhost:5001/api/user/auth/login/facebook/callback`;
    const uri = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${redirect_uri}&scope=public_profile,email`;
    req.strategy = "facebook";
    res.redirect(uri);
  }

  @requestLog()
  @routeConfig({ method: "get", path: "/api/user/auth" + "/login/facebook/callback" })
  async facebookCallback(
    req: Request,
    res: Response,
    _: NextFunction
  ): Promise<any> {
    try {
      const { code } = req.query;
      const request = new AuthRequest(new FacebookStrategy(code as string));
      const user = await request.verify();

      if (user) {
        res.cookie("refresh_token", user.refreshToken, COOKIES_OPTIONS);
      }

      return res.redirect("https://localhost:3001");
    } catch (error) {
      return res.redirect("https://localhost:3001");
    }
  }

  @requestLog()
  @routeConfig({ method: "get", path: "/api/user/auth" + "/token/refresh", middlewares: [refreshTokenProtected] })
  async refreshTokens(
    req: Request,
    res: Response,
    _: NextFunction
  ): Promise<any> {
    const { user } = req;
    const exist = await UserRepository.findById(user._id!);

    const token = generateToken({ userId: exist._id });
    const newRefreshToken = generateRefreshToken({ userId: exist._id });
    exist.refreshToken = newRefreshToken!;
    await exist.save();
    res.cookie("refresh_token", newRefreshToken, COOKIES_OPTIONS);
    return super.sendSuccess(200, res, { token });
  }

  @requestLog()
  @routeConfig({ method: "post", path: "/api/user/auth" + "/register" })
  async register(req: Request, res: Response, _: NextFunction): Promise<any> {
    try {
      const {
        firstName,
        lastName,
        birthday,
        email,
        password,
        confirmPass,
        phoneNumber,
      } = req.body;
      if (!password) {
        return res.status(400).json({ message: "required password" });
      }

      if (password !== confirmPass) {
        return res
          .status(401)
          .json({ message: "password not match confirmation" });
      }

      const userExists = await UserRepository.findOne({ email });

      if (userExists) {
        res.status(400).json({ message: "user already exist" });
      }

      const user = {
        firstName,
        middle_name: "",
        birthday,
        lastName,
        email,
        phoneNumber,
        password,
        active: true,
        emailVerification: false,
      };

      const newUser = await UserRepository.create(user);
      req.register = true;
      req.user = newUser;

      // return next();
      return super.sendSuccess(200, res, newUser);
    } catch (error: any) {
      console.log(error);
      // res.status(500).json({ message: error.message });
      return super.sendError(500, res);
    }
  }

  @requestLog()
  @routeConfig({ method: "get", path: "/api/user/auth" + "/details", middlewares: [userProtected] })
  async getuserDetails(
    req: Request,
    res: Response,
    _: NextFunction
  ): Promise<any> {
    const query = req.query;
    let select = Object.keys(query).join(" ");
    if (!/\S/.test(select) || select === null || select === undefined) {
      select = "-password -refresh_token";
    }

    const user = await UserRepository.findById(
      req.user._id!
    ).select(select);
    return super.sendSuccess(200, res, user);
  }

  @requestLog()
  @routeConfig({ method: "get", path: "/api/users/auth" + "/logout", middlewares: [userProtected] })
  async logout(req: Request, res: Response, _: NextFunction): Promise<any> {
    const user = req.user;
    const exist = await UserRepository.findById(user._id!);
    exist.refreshToken = "";
    await exist.save();
    res.clearCookie("refresh_token", COOKIES_OPTIONS);
    return super.sendSuccess(200, res, null);
  }
}
export default AuthController;
