import sha1 from "sha1";

describe("Auth controller", () => {
  const dummyUser = { email: "test@test.com", password: "test" };

  before(async () => {
    await waitForDBConnection();
    await waitForRedisConnection();

    await dbClient.users.deleteMany({ email: dummyUser.email });
  });

  after(async () => {
    await dbClient.users.deleteMany({ email: dummyUser.email });
  });

  it("GET /connect - Unauthorized", async () => {
    const res = await request.get("/connect");
    expect(res.status).to.equal(401);
    expect(res.body).to.have.keys("error");
    expect(res.body.error).to.equal("Unauthorized");

    const base64Credentials = Buffer.from(`${dummyUser.email}:${dummyUser.password}`).toString('base64');
    const res2 = await request.get("/connect").set('Authorization', `Bearer ${base64Credentials}`);

    expect(res2.status).to.equal(401);
    expect(res2.body).to.have.keys("error");
    expect(res2.body.error).to.equal("Unauthorized");
  });

  it("GET /connect successful", async () => {
    await dbClient.users.insertOne({ email: dummyUser.email, password: sha1(dummyUser.password) });

    const base64Credentials = Buffer.from(`${dummyUser.email}:${dummyUser.password}`).toString('base64');
    const res = await request.get("/connect").set('Authorization', `Bearer ${base64Credentials}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.keys("token");
    expect(res.body.token).to.be.a("string");
  });


});
