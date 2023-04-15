import { Request, Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { Admin } from "../models/admin";

export default async function CheckAdmin(req: Request<{}, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>, number>) {
	if (typeof req.body.login != 'object' || Object.keys(req.body.login).length != 2) {
		res.status(400).send({ status: 400, message: "specify login object" });
		return false;
	}

	if (await Admin.findOne({ email: req.body.login.email }) == null) {
		res.status(404).send({ status: 404, message: "Admin login not found" });
		return false;
	}

	if ((await Admin.findOne({ email: req.body.login.email })).password != req.body.login.password) {
		res.status(403).send({ status: 403, message: "bad login password" });
		return false;
	}

	return true;
}