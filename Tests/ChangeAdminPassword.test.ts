import dotenv from 'dotenv';
import mongoose from 'mongoose';
import request from 'supertest';

import { Admin } from '../Models/Admin';

dotenv.config();

const req = request('http://localhost:8082');

beforeAll(async () => {
	await mongoose.connect(process.env.URI);
});

beforeEach(async () => {
	const admin = new Admin({
		name: 'changePassword',
		email: 'changePassword@example.com',
		password: 'EE26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4940E0DB27AC185F8A0E1D5F84F88BC887FD67B143732C304CC5FA9AD8E6F57F50028A8FF'
	});
	await admin.save();
});

afterEach(async () => {
	await Admin.deleteOne({ email: 'changePassword@example.com' });
});

describe('Put /ChangeAdminPassword', () => {
	it('Should return a 400 if request body is not an object', async () => {
		const res = await req
			.put('/api/ChangeAdminPassword')
			.send('invalidBody');
		expect(res.status).toEqual(400);
		expect(res.body).toHaveProperty('message', 'Specify { email: string, oldPassword: Sha512 string, newPassword: sha512String }');
	});

	it('Should return a 400 if email is not define', async () => {
		const res = await req
			.put('/api/ChangeAdminPassword')
			.send({
				changePassword: 'bad password'
			});
		expect(res.status).toEqual(400);
		expect(res.body).toHaveProperty('message', 'Specify { email: string, oldPassword: Sha512 string, newPassword: sha512String }');
	});

	it('Should return a 400 if newPassword is not define', async () => {
		const res = await req
			.put('/api/ChangeAdminPassword')
			.send({
				email: 'changePassword@example.com',
				oldPassword: 'EE26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4940E0DB27AC185F8A0E1D5F84F88BC887FD67B143732C304CC5FA9AD8E6F57F50028A8FF'
			});
		expect(res.status).toEqual(400);
		expect(res.body).toHaveProperty('message', 'Specify { email: string, oldPassword: Sha512 string, newPassword: sha512String }');
	});

	it('Should return a 400 if oldPassword is not define', async () => {
		const res = await req
			.put('/api/ChangeAdminPassword')
			.send({
				email: 'changePassword@example.com',
				newPassword: 'AA26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4940E0DB27AC185F8A0E1D5F84F88BC887FD67B143732C304CC5FA9AD8E6F57F50028A8FF'
			});
		expect(res.status).toEqual(400);
		expect(res.body).toHaveProperty('message', 'Specify { email: string, oldPassword: Sha512 string, newPassword: sha512String }');
	});

	it('Should return a 400 if email is not a string', async () => {
		const res = await req
			.put('/api/ChangeAdminPassword')
			.send({
				email: 123,
				newPassword: 'AA26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4940E0DB27AC185F8A0E1D5F84F88BC887FD67B143732C304CC5FA9AD8E6F57F50028A8FF',
				oldPassword: 'EE26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4940E0DB27AC185F8A0E1D5F84F88BC887FD67B143732C304CC5FA9AD8E6F57F50028A8FF'
			});
		expect(res.status).toEqual(400);
		expect(res.body).toHaveProperty('message', 'Email must be a string');
	});

	it('Should return a 400 if newPassword is not a sha512 string', async () => {
		const res = await req
			.put('/api/ChangeAdminPassword')
			.send({
				email: 'changePassword@example.com',
				oldPassword: 'EE26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4940E0DB27AC185F8A0E1D5F84F88BC887FD67B143732C304CC5FA9AD8E6F57F50028A8FF',
				newPassword: 'bad password'
			});
		expect(res.status).toEqual(400);
		expect(res.body).toHaveProperty('message', 'NewPassword must be in sha512 format');
	});

	it('Should return a 400 if oldPassword is not a sha512 string', async () => {
		const res = await req
			.put('/api/ChangeAdminPassword')
			.send({
				email: 'changePassword@example.com',
				newPassword: 'AA26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4940E0DB27AC185F8A0E1D5F84F88BC887FD67B143732C304CC5FA9AD8E6F57F50028A8FF',
				oldPassword: 'bad password'
			});
		expect(res.status).toEqual(400);
		expect(res.body).toHaveProperty('message', 'OldPassword must be in sha512 format');
	});

	it('Should return a 403 if oldPassword is wrong', async () => {
		const res = await req
			.put('/api/ChangeAdminPassword')
			.send({
				email: 'changePassword@example.com',
				newPassword: 'AA26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4940E0DB27AC185F8A0E1D5F84F88BC887FD67B143732C304CC5FA9AD8E6F57F50028A8FF',
				oldPassword: 'FF26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4940E0DB27AC185F8A0E1D5F84F88BC887FD67B143732C304CC5FA9AD8E6F57F50028A8FF'
			});
		expect(res.status).toEqual(403);
		expect(res.body).toHaveProperty('message', 'Wrong confidentials');
	});

	it('Should return a 404 if email is not link to an admin', async () => {
		const res = await req
			.put('/api/ChangeAdminPassword')
			.send({
				email: 'example@example.com',
				newPassword: 'AA26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4940E0DB27AC185F8A0E1D5F84F88BC887FD67B143732C304CC5FA9AD8E6F57F50028A8FF',
				oldPassword: 'EE26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4940E0DB27AC185F8A0E1D5F84F88BC887FD67B143732C304CC5FA9AD8E6F57F50028A8FF'
			});
		expect(res.status).toEqual(404);
		expect(res.body).toHaveProperty('message', 'Admin not found');
	});
});
