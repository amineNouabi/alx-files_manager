import { expect } from "chai";
import { existsSync, readFileSync, rmSync } from "fs";
import { ObjectId } from "mongodb";
import { resolve } from "path";
import sha1 from "sha1";

describe("Files controller", () => {
  const dummyUser = { email: "test@test.com", password: "test" };
  let token;

  before(async () => {
    await waitForDBConnection();
    await waitForRedisConnection();

    await dbClient.users.deleteMany({ email: dummyUser.email });
    await redisClient.client.flushall('ASYNC');
  });

  after(async () => {
    await dbClient.users.deleteMany({ email: dummyUser.email });
    await redisClient.client.flushall('ASYNC');
  });

  it("POST /files - Unauthorized", async () => {
    const res = await request.post("/files");
    expect(res.status).to.equal(401);
    expect(res.body).to.have.keys("error");
    expect(res.body.error).to.equal("Unauthorized");

    const res2 = await request.post("/files").set("X-Token", "invalid");
    expect(res2.status).to.equal(401);
    expect(res2.body).to.have.keys("error");
    expect(res2.body.error).to.equal("Unauthorized");

    const user = await dbClient.users.insertOne({ email: dummyUser.email, password: sha1(dummyUser.password) });

    const connect_res = await request.get("/connect").auth(dummyUser.email, dummyUser.password, { type: 'basic' });
    expect(connect_res.status).to.equal(200);
    expect(connect_res.body).to.have.keys("token");
    expect(connect_res.body.token).to.be.a("string");
    token = connect_res.body.token;
  });


  it("POST /files - Missing name", async () => {

    const res = await request.post("/files").set("X-Token", token).send({});
    expect(res.status).to.equal(400);
    expect(res.body).to.have.keys("error");
    expect(res.body.error).to.equal("Missing name");

    const res2 = await request.post("/files").set("X-Token", token).send({ type: "file" });
    expect(res2.status).to.equal(400);
    expect(res2.body).to.have.keys("error");
    expect(res2.body.error).to.equal("Missing name");

    const res3 = await request.post("/files").set("X-Token", token).send({ type: "file", data: "data" });
    expect(res3.status).to.equal(400);
    expect(res3.body).to.have.keys("error");
    expect(res3.body.error).to.equal("Missing name");

  });

  it("POST /files - (Missing | invalid) type", async () => {

    const res2 = await request.post("/files").set("X-Token", token).send({ name: "test" });
    expect(res2.status).to.equal(400);
    expect(res2.body).to.have.keys("error");
    expect(res2.body.error).to.equal("Missing type");

    const res3 = await request.post("/files").set("X-Token", token).send({ name: "test", type: "invalid" });
    expect(res3.status).to.equal(400);
    expect(res3.body).to.have.keys("error");
    expect(res3.body.error).to.equal("Missing type");
  });

  it("POST /files - Missing data for (file | image)", async () => {

    const res2 = await request.post("/files").set("X-Token", token).send({ name: "test", type: "file" });
    expect(res2.status).to.equal(400);
    expect(res2.body).to.have.keys("error");
    expect(res2.body.error).to.equal("Missing data");

    const res3 = await request.post("/files").set("X-Token", token).send({ name: "test", type: "image" });
    expect(res3.status).to.equal(400);
    expect(res3.body).to.have.keys("error");
    expect(res3.body.error).to.equal("Missing data");
  });

  it("POST /files - Parent (not found | not a folder)", async () => {
    const parentId = "5f9d88b2f3f6e5d3a5e6c7e8";
    const existingFile = await dbClient.files.findOne({ _id: parentId });
    expect(existingFile).to.be.null;

    const res = await request.post('/files').set("X-Token", token).send({ name: "test", type: "folder", parentId });
    expect(res.status).to.equal(400);
    expect(res.body).to.have.keys("error");
    expect(res.body.error).to.equal("Parent not found");

    const tempFile = await dbClient.files.insertOne({ name: "test", type: "file" });
    const res2 = await request.post('/files').set("X-Token", token).send({ name: "test", type: "folder", parentId: tempFile.insertedId });
    expect(res2.status).to.equal(400);
    expect(res2.body).to.have.keys("error");
    expect(res2.body.error).to.equal("Parent is not a folder");
    await dbClient.files.deleteOne({ _id: tempFile.insertedId });

  });

  it ("POST /files - Success", async () => {
    const res = await request.post('/files').set("X-Token", token).send({ name: "test", type: "folder" });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.keys("id", "userId", "name", "type", "isPublic", "parentId");
    expect(res.body.id).to.be.a("string");
    expect(res.body.userId).to.be.a("string");
    expect(res.body.name).to.equal("test");
    expect(res.body.type).to.equal("folder");
    expect(res.body.isPublic).to.be.false;
    expect(res.body.parentId).to.equal(0);


    const res2 = await request.post('/files').set("X-Token", token).send({ name: "test.txt", type: "file", data: "SGVsbG8gV2Vic3RhY2shCg==", parentId: res.body.id });
    expect(res2.status).to.equal(201);
    expect(res2.body).to.have.keys("id", "userId", "name", "type", "isPublic", "parentId");
    expect(res2.body.id).to.be.a("string");
    expect(res2.body.userId).to.be.a("string");
    expect(res2.body.name).to.equal("test.txt");
    expect(res2.body.type).to.equal("file");
    expect(res2.body.isPublic).to.be.false;
    expect(res2.body.parentId).to.equal(res.body.id);

    const file = await dbClient.files.findOne({ _id: new ObjectId(res2.body.id) });
    expect(file).to.not.be.null;
    expect(existsSync(resolve(file.localPath))).to.be.true;
    expect(readFileSync(resolve(file.localPath), { encoding: 'utf-8' }).trim()).to.equal("Hello Webstack!");
    rmSync(resolve(file.localPath));
  });
});
