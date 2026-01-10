const chai = require("chai");
const chaiHttp = require("chai-http");

const { expect } = chai;
chai.use(chaiHttp);

const BASE_URL = "http://localhost:3000";

describe("API contract tests", () => {

  describe("Auth endpoints", () => {
    it("POST /api/auth/login returns expected keys", async () => {
      const res = await chai
        .request(BASE_URL)
        .post("/api/auth/login")
        .send({ username: "test", password: "test" });

      expect(res).to.have.status.within(200, 401);
      expect(res.body).to.be.an("object");
      expect(res.body).to.have.any.keys("token", "message");
    });
  });
});
