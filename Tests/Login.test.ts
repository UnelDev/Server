import dotenv from 'dotenv';
import mongoose from 'mongoose';
import request from 'supertest';

import { User } from '../Models/User';

dotenv.config();

const req = request('http://localhost:8082');

beforeAll(async () => {
	await mongoose.connect(process.env.URI);
});

beforeEach(async () => {
	const user = new User({
		name: 'LoginPassword',
		email: 'LoginPassword@example.com',
		password: 'EE26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4940E0DB27AC185F8A0E1D5F84F88BC887FD67B143732C304CC5FA9AD8E6F57F50028A8FF'
	});
	await user.save();
});

afterEach(async () => {
	await User.deleteOne({ email: 'LoginPassword@example.com' });
});


describe('POST /Login', () => {
	it('Should return a 400 if request body is not an object', async () => {
		const res = await req
			.post('/api/Login')
			.send('invalidBody');
		expect(res.status).toEqual(400);
		expect(res.body).toHaveProperty('message', 'Specify { email: String, password: Sha512 String }');
	});

	it('Should return a 400 if email is not define', async () => {
		const res = await req
			.post('/api/Login')
			.send({
				password: 'bad password'
			});
		expect(res.status).toEqual(400);
		expect(res.body).toHaveProperty('message', 'Specify { email: String, password: Sha512 String }');
	});

	it('Should return a 400 if password is not define', async () => {
		const res = await req
			.post('/api/Login')
			.send({
				email: 'LoginPassword@example.com',
			});
		expect(res.status).toEqual(400);
		expect(res.body).toHaveProperty('message', 'Specify { email: String, password: Sha512 String }');
	});

	it('Should return a 400 if email is not a string', async () => {
		const res = await req
			.post('/api/Login')
			.send({
				email: 123,
				password: 'EE26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4940E0DB27AC185F8A0E1D5F84F88BC887FD67B143732C304CC5FA9AD8E6F57F50028A8FF'
			});
		expect(res.status).toEqual(400);
		expect(res.body).toHaveProperty('message', 'Email must be a string');
	});

	it('Should return a 400 if password is not a sha512 string', async () => {
		const res = await req
			.post('/api/Login')
			.send({
				email: 'LoginPassword@example.com',
				password: 'bad password'
			});
		expect(res.status).toEqual(400);
		expect(res.body).toHaveProperty('message', 'The password must be in sha512');
	});

	it('Should return a 404 if email is not link to a user', async () => {
		const res = await req
			.post('/api/Login')
			.send({
				email: 'example@example.com',
				password: 'EE26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4940E0DB27AC185F8A0E1D5F84F88BC887FD67B143732C304CC5FA9AD8E6F57F50028A8FF'
			});
		expect(res.status).toEqual(404);
		expect(res.body).toHaveProperty('message', 'User not found');
	});
});
