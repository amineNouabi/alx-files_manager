import sha1 from "sha1";

describe("Auth controller", () => {
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

  it("GET /connect - Missing token | non-existing user", async () => {
    const res = await request.get("/connect");
    expect(res.status).to.equal(401);
    expect(res.body).to.have.keys("error");
    expect(res.body.error).to.equal("Unauthorized");

    const res2 = await request.get("/connect").auth(dummyUser.email, dummyUser.password, { type: 'basic' });
    expect(res2.status).to.equal(401);
    expect(res2.body).to.have.keys("error");
    expect(res2.body.error).to.equal("Unauthorized");
  });

  it("GET /disconnect - Missing token | before connecting", async () => {
    const res = await request.get("/disconnect");
    expect(res.status).to.equal(401);
    expect(res.body).to.have.keys("error");
    expect(res.body.error).to.equal("Unauthorized");
  });

  it("GET /connect", async () => {
    const user = await dbClient.users.insertOne({ email: dummyUser.email, password: sha1(dummyUser.password) });

    const res = await request.get("/connect").auth(dummyUser.email, dummyUser.password, { type: 'basic' });
    expect(res.status).to.equal(200);
    expect(res.body).to.have.keys("token");
    expect(res.body.token).to.be.a("string");
    expect(await redisClient.get(`auth_${res.body.token}`)).to.equal(user.insertedId.toString());

    const res2 = await request.get("/users/me").set("X-Token", res.body.token);
    expect(res2.status).to.equal(200);
    expect(res2.body).to.have.keys("id", "email");
    expect(res2.body.email).to.equal(dummyUser.email);
    expect(res2.body.id).to.equal(user.insertedId.toString());

    token = res.body.token;
  });

  it("GET /disconnect", async () => {
    const res = await request.get("/disconnect").set("X-Token", token);
    expect(res.status).to.equal(204);
    expect(await redisClient.get(`auth_${token}`)).to.be.null;

    const res2 = await request.get("/users/me").set("X-Token", token);
    expect(res2.status).to.equal(401);
    expect(res2.body).to.have.keys("error");
    expect(res2.body.error).to.equal("Unauthorized");
  });

});
