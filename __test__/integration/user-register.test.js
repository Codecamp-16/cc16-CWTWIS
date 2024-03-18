const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/user/User");
const database = require("../../src/config/database");
const nodemailerStub = require("nodemailer-stub");
const SMTPServer = require("smtp-server").SMTPServer;

let server, lastMail;
beforeAll(async () => {
  server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
      let mailBody;
      stream.on("data", (data) => {
        mailBody += data.toString();
      });
      stream.on("end", () => {
        lastMail = mailBody;
        callback();
      });
    },
  });
  await server.listen(8587, "localhost");
});

// Stub => mock return value
// User = jest.fn().mockReturnValue(() => ({ id: 1, email: "user1@gmail.com" }));

// Spy => behavior
// jest.fn().spyOn("User");
// expect(User.create).toHaveBeenCalled()

// Mock => Fully implementation
// User.create = jest.fn().mockImplementation((a, b) => a + b);

// Fake =>

let validUser = {
  username: "user1",
  email: "user1@mail.com",
  password: "P4ssword",
};
const postUser = async (user = validUser) => {
  return request(app).post("/api/v1.0/register").send(user);
};

describe("User register", () => {
  beforeAll(() => {
    return database.sync();
  });

  beforeEach(() => {
    // tear down user
    return User.destroy({ truncate: true });
  });
  //   afterAll(async () => {
  //     await database.sync({ force: true });
  //   });

  //   it===test
  it("should return status 200 when register with valid user", async () => {
    const response = await postUser();
    expect(response.status).toBe(200);
  });

  it("should return user crate when register success", async () => {
    const response = await postUser();
    expect(response.body.message).toBe("User created");
  });

  it("should saved user to database when register success", async () => {
    await postUser();

    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it("should saved username and email into database", async () => {
    await postUser();
    const userList = await User.findAll();
    expect(userList[0].username).toBe(validUser.username);
    expect(userList[0].email).toBe(validUser.email);
  });

  it("should hashed password to database", async () => {
    await postUser();
    const userList = await User.findAll();
    expect(userList[0].password).not.toBe(validUser.password);
  });
});

describe("Validation", () => {
  beforeAll(() => {
    return database.sync();
  });

  beforeEach(() => {
    // tear down user
    return User.destroy({ truncate: true });
  });
  // Z = zero
  it("should return status 400 when username is null", async () => {
    let user = {
      username: null,
      email: "user1@gmail.com",
      password: "P4ssword",
    };
    const response = await postUser(user);
    expect(response.status).toBe(400);
  });

  it("should return validationErrors in username when username is null", async () => {
    let user = {
      username: null,
      email: "user1@gmail.com",
      password: "P4ssword",
    };
    const response = await postUser(user);
    expect(response.body.validationError.username).toBeDefined();
  });

  it("should return username cannot be null when username is null", async () => {
    let user = {
      username: null,
      email: "user1@gmail.com",
      password: "P4ssword",
    };
    const response = await postUser(user);
    expect(response.body.validationError.username).toBe(
      "Username cannot be null"
    );
  });

  //   dynamic test (Z: zero value)
  it.each([
    [null, "user1@gmail.com", "P4ssword"],
    ["user1", null, "P4ssword"],
    ["user1", "user1@gmail.com", null],
  ])(
    "should return status 400 when username=%s, email=%s, password=%s",
    async (username, email, password) => {
      let user = {
        username,
        email,
        password,
      };
      const response = await postUser(user);
      expect(response.status).toBe(400);
    }
  );

  //   Dynamic test : (O: one, M: many==combination, B = Boundary)
  it.each`
    username          | email                | password      | expectedMessage                            | violateField
    ${"a"}            | ${"user1@email.com"} | ${"P4ssword"} | ${"Must have min 4 and max 32 characters"} | ${"username"}
    ${"a".repeat(33)} | ${"user1@email.com"} | ${"P4ssword"} | ${"Must have min 4 and max 32 characters"} | ${"username"}
    ${"user1"}        | ${"email.com"}       | ${"P4ssword"} | ${"Email is not valid"}                    | ${"email"}
  `(
    "should return message $expectedMessage when violate at $violateField, username=$username, email=$email, password=$password",
    async ({ username, email, password, expectedMessage, violateField }) => {
      let user = { username, email, password };
      const response = await postUser(user);
      //   console.log(response.body);
      expect(response.body.validationError[violateField]).toBe(expectedMessage);
    }
  );
});

describe("Internationalization", () => {
  beforeAll(() => {
    return database.sync();
  });

  beforeEach(() => {
    // tear down user
    return User.destroy({ truncate: true });
  });
  it("should return สร้างบัญชีผู้ใช้งานสำเร็จ when register success", async () => {
    const agent = request(app).post("/api/v1.0/register");
    agent.set("Accept-Language", "th");
    const response = await agent.send({ ...validUser });
    expect(response.body.message).toBe("สร้างบัญชีผู้ใช้งานสำเร็จ");
  });
  it("should return กรุณาระบุชื่อผู้ใช้งาน when username is null", async () => {
    const agent = request(app).post("/api/v1.0/register");
    agent.set("Accept-Language", "th");
    let user = {
      username: null,
      email: "user1@gmail.com",
      password: "P4ssword",
    };
    const response = await agent.send(user);
    expect(response.body.validationError.username).toBe(
      "กรุณาระบุชื่อผู้ใช้งาน"
    );
  });
});

describe("Send Activation Email", () => {
  it("send an Account activation email with activation token", async () => {
    await postUser({ ...validUser });
    // const lastMail = nodemailerStub.interactsWithMail.lastMail();
    // console.log(lastMail);
    // expect(lastMail.to[0]).toBe(validUser.email);
    expect(lastMail).toContain(validUser.email);
  });
});
