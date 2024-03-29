import { Request, Response } from "express-serve-static-core";
import { Document, Types } from "mongoose";
import { ParsedQs } from "qs";

import CheckAdmin from "../Functions/CheckAdmin";
import { Log } from "../Functions/Logs";

import { Box } from "../Models/Box";
import { User } from "../Models/User";

/*
**{
**	login:{
**		username:string
**		password:stringSha512
**	},
**	name:string|id:string,
**	numberOfSlot:number
**}
*/

export default async function Unassign(req: Request<{}, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>, number>) {
	if (typeof req.body != 'object' || Object.keys(req.body).length != 3) {
		Log('unassing.ts', 'WARNING', 'Invalid body');
		res.status(400).send({ status: 400, message: "Specify { login: { username: String, password: Sha512 String }, name: String|id, numberOfSlot: Number }" });
		return;
	}

	if (!await CheckAdmin(req, res)) {
		Log('unassing.ts', 'WARNING', 'Invalid admin login');
		return;
	}

	if (typeof req.body.numberOfSlot != 'number') {
		Log('unassing.ts', 'WARNING', 'Invalid type for "numberOfSlot"');
		res.status(400).send({ message: 'numberOfSlot must be a number' });
		return;
	}

	if (req.body.name) {
		if (req.body.id) {
			Log('unassing.ts', 'WARNING', 'Usage of "id" AND "name"');
			res.status(400).send({ message: 'Use id OR name. Only one is allowed. Prefer to use id' });
			return;
		}
		if (typeof req.body.name != 'string') {
			Log('unassing.ts', 'WARNING', 'Invalid type for name');
			res.status(400).send({ message: 'Name must be a string' });
			return;
		}

		const response = await find({ name: req.body.name }, req.body.numberOfSlot, req.body.login.email);
		res.status(response.code).send({ message: response.message });

	} else if (req.body.id) {
		if (req.body.name) {
			Log('unassing.ts', 'WARNING', 'Usage of "id" AND "name"');
			res.status(400).send({ message: 'Use id OR name. Only one is allowed. Prefer to use id' });
			return;
		}
		if (typeof req.body.id != 'string') {
			Log('unassing.ts', 'WARNING', 'Invalid type for id');
			res.status(400).send({ message: 'Id must be a string' });
			return;
		}
		const response = await find(req.body.id, req.body.numberOfSlot, req.body.login.email);
		res.status(response.code).send({ message: response.message });

	} else {
		Log('unassing.ts', 'WARNING', 'Missing "id" or "name"');
		res.status(400).send({ message: 'Specify name or id of the box' });
		return;
	}

}

async function find(key: { name: string } | String, slotNumber: number, AdminEmail: string) {
	let box: Document<unknown, {}, { name: string; placement: string; slot: any[]; size: number; createdAt: Date; }> & Omit<{ name: string; placement: string; slot: any[]; size: number; createdAt: Date; } & { _id: Types.ObjectId; }, never>;
	if (typeof key == 'string') {
		box = await Box.findById(key);
	} else if (typeof key == 'object') {
		box = await Box.findOne(key);
	}

	if (!box) {
		Log('unassing.ts', 'WARNING', 'Box not found');
		return { code: 404, message: 'Box not found' };
	}

	if (slotNumber > box.slot.length) {
		Log('unassing.ts', 'WARNING', 'Slot number is higher than the number of slots');
		return { code: 400, message: 'Slot number is higher than the number of slots' }
	}

	if (!Array.isArray(box.slot[slotNumber])) {
		Log('unassing.ts', 'WARNING', `Admin ${AdminEmail} to request the unassing of slot ${slotNumber} but the slot is not allocated`);
		return { code: 400, message: 'Slot required is not allocated' };
	}

	if (!(box.slot[slotNumber][1] instanceof Date && !isNaN(box.slot[slotNumber][1]))) {
		//critical beacause the user in this box is unknow
		Log('unassing.ts', 'CRITICAL', `Admin ${AdminEmail} to request the unassing of slot ${slotNumber} but the date of reservation isn't date`);
		return { code: 500, message: 'this slot does not contain date' };
	}

	const user = await User.findById(box.slot[slotNumber][0]);
	if (!user) {
		//critical beacause the user in this box is unknow
		Log('unassing.ts', 'CRITICAL', `Admin ${AdminEmail} to request the unassing of slot ${slotNumber} but the assigned user dose not exist`);
		return { code: 404, message: 'user not found' };
	}

	if (typeof user.timeOfUse != 'number') {
		Log('unassing.ts', 'ERROR', `Admin ${AdminEmail} found an error, user ${user._id} does not have the correct type of timeOfUse`);
		return { code: 500, message: 'user in this slot generate an error' };
	}

	await user.updateOne({
		timeOfUse: user.timeOfUse + (new Date().getTime() - new Date(box.slot[slotNumber][1]).getTime())
	})
	box.slot[slotNumber] = null;
	await box.save();

	Log('unassing.ts', 'INFORMATION', `Box "${box.id}": Slot "${slotNumber}" has been unassigned`);
	return { code: 200, message: 'Slot unassigned successfully' };
}
