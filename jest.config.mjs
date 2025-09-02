// jest.config.mjs
export default {
    testEnvironment: "node",
    moduleFileExtensions: ["js", "mjs", "json"],
    testMatch: [
      "**/test/**/*.[jt]s?(x)",
      "**/?(*.)+(spec|test).[jt]s?(x)",
      "**/test/**/*.(test|spec).mjs"
    ]
  };
  