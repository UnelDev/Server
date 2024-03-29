import { Request, Response } from "express-serve-static-core";
import { ParsedQs } from "qs";

import { Log } from "../Functions/Logs";

import { Admin } from "../Models/Admin";

export default async function changeAdminPassword(req: Request<{}, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>, number>) {
	const regexSHA512 = /^[a-fA-F0-9]{128}$/;

	if (typeof req.body != 'object' || Object.keys(req.body).length != 3) {
		Log('changeAdminPassword.ts', 'WARNING', 'Invalid body');
		res.status(400).send({ message: "Specify { email: string, oldPassword: Sha512 string, newPassword: sha512String }" });
		return;
	}
	if (!req.body.email || typeof req.body.email != 'string') {
		Log('changeAdminPassword.ts', 'WARNING', 'Invalid type for email');
		res.status(400).send({ message: "Email must be a string" });
		return;
	}
	if (!req.body.oldPassword || req.body.oldPassword.length != 128 || !regexSHA512.test(req.body.oldPassword)) {
		Log('changeAdminPassword.ts', 'WARNING', 'Invalid format for oldPassword');
		res.status(400).send({ message: 'OldPassword must be in sha512 format' })
		return;
	}

	const admin = await Admin.findOne({ email: req.body.email });
	if (!admin) {
		Log('changeAdminPassword.ts', 'WARNING', 'Admin not found');
		res.status(404).send({ message: 'Admin not found' });
		return;
	}
	if (admin.password != req.body.oldPassword) {
		Log('changeAdminPassword.ts', 'WARNING', 'Wrong confidentials');
		res.status(403).send({ message: 'Wrong confidentials' });
		return;
	}

	if (!req.body.newPassword || req.body.newPassword.length != 128 || !regexSHA512.test(req.body.newPassword)) {
		Log('changeAdminPassword.ts', 'WARNING', 'Invalid format for newPassword');
		res.status(400).send({ message: 'NewPassword must be in sha512 format' })
		return;
	}

	await Admin.findOneAndUpdate(
		{ email: req.body.email },
		{ password: req.body.newPassword },
		{ new: true }
	);

	Log('changeAdminPassword.ts', 'INFORMATION', 'Admin "' + req.body.login.email + '" changed his password');
	res.send({ message: 'Operation success' });
}