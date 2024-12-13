import sha1 from "sha1";

describe("Users controller", () => {
  const dummyUser = { email: "test@test.com", password: "test" };

  before(async () => {
    await waitForDBConnection();
    await waitForRedisConnection();

    await dbClient.users.deleteMany({ email: dummyUser.email });
  });

  after(async () => {
    await dbClient.users.deleteMany({ email: dummyUser.email });
  });

  it("POST /users - Missing email | password", async () => {
    const res = await request.post("/users").send({});
    expect(res.status).to.equal(400);
    expect(res.body).to.have.keys("error");
    expect(res.body.error).to.equal("Missing email");

    const res2 = await request.post("/users").send({ email: dummyUser.email });
    expect(res2.status).to.equal(400);
    expect(res2.body).to.have.keys("error");
    expect(res2.body.error).to.equal("Missing password");
  });

  it("POST /users", async () => {
    const res = await request.post("/users").send(dummyUser);
    expect(res.status).to.equal(201);
    expect(res.body).to.have.keys("id", "email");
    expect(res.body.email).to.equal(dummyUser.email);

    const user = await dbClient.users.findOne({ email: dummyUser.email });
    expect(user).to.not.be.null;
    expect(user).to.have.key("_id", "email", "password");
    expect(user.email).to.equal(dummyUser.email);
    expect(user.password).to.equal(sha1(dummyUser.password));
    expect(user._id.toString()).to.equal(res.body.id);
  });

  it("POST /users - Already exists", async () => {
    const res = await request.post("/users").send(dummyUser);
    expect(res.status).to.equal(400);
    expect(res.body).to.have.keys("error");
    expect(res.body.error).to.equal("Already exist");
  });

  it('GET /users/me - Unauthenticated', async () => {
    const res = await request.get("/users/me");
    expect(res.status).to.equal(401);
    expect(res.body).to.have.keys("error");
    expect(res.body.error).to.equal("Unauthorized");
  });

  it('GET /users/me - Invalid token', async () => {
    const res = await request.get("/users/me").set("X-Token", "invalid");
    expect(res.status).to.equal(401);
    expect(res.body).to.have.keys("error");
    expect(res.body.error).to.equal("Unauthorized");
  });

  it('GET /users/me', async () => {
    const res = await request.get("/connect").auth(dummyUser.email, dummyUser.password, { type: 'basic' });
    expect(res.status).to.equal(200);
    expect(res.body).to.have.keys("token");
    expect(res.body.token).to.be.a("string");

    const res2 = await request.get("/users/me").set("X-Token", res.body.token);
    expect(res2.status).to.equal(200);
    expect(res2.body).to.have.keys("id", "email");
    expect(res2.body.email).to.equal(dummyUser.email);
  });

});
