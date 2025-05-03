
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime,
  createParam,
} = require('./runtime/wasm.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}





/**
 * Enums
 */
exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  topImage: 'topImage',
  age: 'age',
  ageVisible: 'ageVisible',
  email: 'email',
  hashedPassword: 'hashedPassword',
  primaryAuthMethod: 'primaryAuthMethod',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  subscriptionStatus: 'subscriptionStatus',
  subscriptionPlan: 'subscriptionPlan',
  subscriptionStart: 'subscriptionStart',
  subscriptionEnd: 'subscriptionEnd',
  emailVerified: 'emailVerified',
  image: 'image',
  selfIntroduction: 'selfIntroduction'
};

exports.Prisma.UserProviderScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  provider: 'provider',
  providerId: 'providerId',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  createdAt: 'createdAt'
};

exports.Prisma.UnitScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  learningGoal: 'learningGoal',
  preLearningState: 'preLearningState',
  reflection: 'reflection',
  nextAction: 'nextAction',
  achievementLevel: 'achievementLevel',
  startDate: 'startDate',
  endDate: 'endDate',
  displayFlag: 'displayFlag',
  status: 'status',
  likesCount: 'likesCount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  commentsCount: 'commentsCount'
};

exports.Prisma.LogScalarFieldEnum = {
  id: 'id',
  unitId: 'unitId',
  userId: 'userId',
  title: 'title',
  learningTime: 'learningTime',
  note: 'note',
  logDate: 'logDate',
  effectScore: 'effectScore',
  effectType: 'effectType',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ResourceScalarFieldEnum = {
  id: 'id',
  logId: 'logId',
  resourceType: 'resourceType',
  resourceLink: 'resourceLink',
  description: 'description',
  fileName: 'fileName',
  filePath: 'filePath',
  createdAt: 'createdAt'
};

exports.Prisma.TagScalarFieldEnum = {
  id: 'id',
  name: 'name'
};

exports.Prisma.UnitTagScalarFieldEnum = {
  unitId: 'unitId',
  tagId: 'tagId'
};

exports.Prisma.LogTagScalarFieldEnum = {
  logId: 'logId',
  tagId: 'tagId'
};

exports.Prisma.UserSkillScalarFieldEnum = {
  userId: 'userId',
  tagId: 'tagId'
};

exports.Prisma.UserInterestScalarFieldEnum = {
  userId: 'userId',
  tagId: 'tagId'
};

exports.Prisma.UnitLikeScalarFieldEnum = {
  userId: 'userId',
  unitId: 'unitId',
  createdAt: 'createdAt'
};

exports.Prisma.CommentScalarFieldEnum = {
  id: 'id',
  unitId: 'unitId',
  userId: 'userId',
  comment: 'comment',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.ErrorLogScalarFieldEnum = {
  id: 'id',
  message: 'message',
  stack: 'stack',
  digest: 'digest',
  url: 'url',
  userAgent: 'userAgent',
  timestamp: 'timestamp',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  User: 'User',
  UserProvider: 'UserProvider',
  Unit: 'Unit',
  Log: 'Log',
  Resource: 'Resource',
  Tag: 'Tag',
  UnitTag: 'UnitTag',
  LogTag: 'LogTag',
  UserSkill: 'UserSkill',
  UserInterest: 'UserInterest',
  UnitLike: 'UnitLike',
  Comment: 'Comment',
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  ErrorLog: 'ErrorLog'
};
/**
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "/Users/kawauchikentarou/webdevbc/learning-journal/prisma/generated/client",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "darwin-arm64",
        "native": true
      }
    ],
    "previewFeatures": [
      "driverAdapters"
    ],
    "sourceFilePath": "/Users/kawauchikentarou/webdevbc/learning-journal/prisma/schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../../.env"
  },
  "relativePath": "../..",
  "clientVersion": "6.6.0",
  "engineVersion": "f676762280b54cd07c770017ed3711ddde35f37a",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "generator client {\n  provider        = \"prisma-client-js\"\n  previewFeatures = [\"driverAdapters\"]\n  engineType      = \"library\"\n  output          = \"./generated/client\"\n}\n\ndatasource db {\n  provider     = \"postgresql\"\n  url          = env(\"DATABASE_URL\")\n  directUrl    = env(\"DIRECT_URL\")\n  relationMode = \"prisma\"\n}\n\nmodel User {\n  id                 String         @id @default(cuid())\n  name               String?\n  topImage           String?\n  age                Int?\n  ageVisible         Boolean        @default(true)\n  email              String         @unique\n  hashedPassword     String?\n  primaryAuthMethod  String\n  createdAt          DateTime       @default(now())\n  updatedAt          DateTime       @updatedAt\n  subscriptionStatus String?\n  subscriptionPlan   String?\n  subscriptionStart  DateTime?\n  subscriptionEnd    DateTime?\n  emailVerified      DateTime?\n  image              String?\n  selfIntroduction   String?\n  accounts           Account[]\n  comments           Comment[]\n  logs               Log[]\n  sessions           Session[]\n  units              Unit[]\n  unitLikes          UnitLike[]\n  userInterests      UserInterest[]\n  providers          UserProvider[]\n  userSkills         UserSkill[]\n}\n\nmodel UserProvider {\n  id           Int      @id @default(autoincrement())\n  userId       String\n  provider     String\n  providerId   String\n  accessToken  String?\n  refreshToken String?\n  createdAt    DateTime @default(now())\n  user         User     @relation(fields: [userId], references: [id])\n\n  @@unique([provider, providerId])\n}\n\nmodel Unit {\n  id               Int        @id @default(autoincrement())\n  userId           String\n  title            String\n  learningGoal     String?\n  preLearningState String?\n  reflection       String?\n  nextAction       String?\n  achievementLevel Int?       @default(0)\n  startDate        DateTime?\n  endDate          DateTime?\n  displayFlag      Boolean    @default(true)\n  status           String     @default(\"PLANNED\")\n  likesCount       Int        @default(0)\n  createdAt        DateTime   @default(now())\n  updatedAt        DateTime   @updatedAt\n  commentsCount    Int        @default(0)\n  comments         Comment[]\n  logs             Log[]\n  user             User       @relation(fields: [userId], references: [id])\n  unitLikes        UnitLike[]\n  unitTags         UnitTag[]\n\n  @@index([userId])\n  @@index([status])\n  @@index([createdAt])\n}\n\nmodel Log {\n  id           Int        @id @default(autoincrement())\n  unitId       Int\n  userId       String\n  title        String\n  learningTime Int?\n  note         String?\n  logDate      DateTime\n  effectScore  Int?\n  effectType   String?\n  createdAt    DateTime   @default(now())\n  updatedAt    DateTime   @updatedAt\n  unit         Unit       @relation(fields: [unitId], references: [id])\n  user         User       @relation(fields: [userId], references: [id])\n  logTags      LogTag[]\n  resources    Resource[]\n}\n\nmodel Resource {\n  id           Int      @id @default(autoincrement())\n  logId        Int\n  resourceType String?\n  resourceLink String\n  description  String?\n  fileName     String?\n  filePath     String?\n  createdAt    DateTime @default(now())\n  log          Log      @relation(fields: [logId], references: [id])\n}\n\nmodel Tag {\n  id            Int            @id @default(autoincrement())\n  name          String         @unique\n  logTags       LogTag[]\n  unitTags      UnitTag[]\n  userInterests UserInterest[]\n  userSkills    UserSkill[]\n}\n\nmodel UnitTag {\n  unitId Int\n  tagId  Int\n  tag    Tag  @relation(fields: [tagId], references: [id])\n  unit   Unit @relation(fields: [unitId], references: [id])\n\n  @@id([unitId, tagId])\n}\n\nmodel LogTag {\n  logId Int\n  tagId Int\n  log   Log @relation(fields: [logId], references: [id])\n  tag   Tag @relation(fields: [tagId], references: [id])\n\n  @@id([logId, tagId])\n}\n\nmodel UserSkill {\n  userId String\n  tagId  Int\n  tag    Tag    @relation(fields: [tagId], references: [id])\n  user   User   @relation(fields: [userId], references: [id])\n\n  @@id([userId, tagId])\n}\n\nmodel UserInterest {\n  userId String\n  tagId  Int\n  tag    Tag    @relation(fields: [tagId], references: [id])\n  user   User   @relation(fields: [userId], references: [id])\n\n  @@id([userId, tagId])\n}\n\nmodel UnitLike {\n  userId    String\n  unitId    Int\n  createdAt DateTime @default(now())\n  unit      Unit     @relation(fields: [unitId], references: [id])\n  user      User     @relation(fields: [userId], references: [id])\n\n  @@id([userId, unitId])\n}\n\nmodel Comment {\n  id        Int      @id @default(autoincrement())\n  unitId    Int\n  userId    String\n  comment   String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  unit      Unit     @relation(fields: [unitId], references: [id])\n  user      User     @relation(fields: [userId], references: [id])\n}\n\nmodel Account {\n  userId            String\n  type              String\n  provider          String\n  providerAccountId String\n  refresh_token     String?\n  access_token      String?\n  expires_at        Int?\n  token_type        String?\n  scope             String?\n  id_token          String?\n  session_state     String?\n  createdAt         DateTime @default(now())\n  updatedAt         DateTime @updatedAt\n  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@id([provider, providerAccountId])\n}\n\nmodel Session {\n  sessionToken String   @unique\n  userId       String\n  expires      DateTime\n  createdAt    DateTime @default(now())\n  updatedAt    DateTime @updatedAt\n  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n}\n\nmodel VerificationToken {\n  identifier String\n  token      String\n  expires    DateTime\n\n  @@id([identifier, token])\n}\n\nmodel ErrorLog {\n  id        Int      @id @default(autoincrement())\n  message   String\n  stack     String?  @db.Text\n  digest    String?\n  url       String?\n  userAgent String?\n  timestamp DateTime @default(now())\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n",
  "inlineSchemaHash": "61c7daac66f1ac117ff813b4a075f282c57cdd307ab9507886943e8a67870e7e",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"topImage\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"age\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"ageVisible\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"hashedPassword\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"primaryAuthMethod\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"subscriptionStatus\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"subscriptionPlan\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"subscriptionStart\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"subscriptionEnd\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"emailVerified\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"image\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"selfIntroduction\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"accounts\",\"kind\":\"object\",\"type\":\"Account\",\"relationName\":\"AccountToUser\"},{\"name\":\"comments\",\"kind\":\"object\",\"type\":\"Comment\",\"relationName\":\"CommentToUser\"},{\"name\":\"logs\",\"kind\":\"object\",\"type\":\"Log\",\"relationName\":\"LogToUser\"},{\"name\":\"sessions\",\"kind\":\"object\",\"type\":\"Session\",\"relationName\":\"SessionToUser\"},{\"name\":\"units\",\"kind\":\"object\",\"type\":\"Unit\",\"relationName\":\"UnitToUser\"},{\"name\":\"unitLikes\",\"kind\":\"object\",\"type\":\"UnitLike\",\"relationName\":\"UnitLikeToUser\"},{\"name\":\"userInterests\",\"kind\":\"object\",\"type\":\"UserInterest\",\"relationName\":\"UserToUserInterest\"},{\"name\":\"providers\",\"kind\":\"object\",\"type\":\"UserProvider\",\"relationName\":\"UserToUserProvider\"},{\"name\":\"userSkills\",\"kind\":\"object\",\"type\":\"UserSkill\",\"relationName\":\"UserToUserSkill\"}],\"dbName\":null},\"UserProvider\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"provider\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"providerId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"accessToken\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"refreshToken\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"UserToUserProvider\"}],\"dbName\":null},\"Unit\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"learningGoal\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"preLearningState\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"reflection\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"nextAction\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"achievementLevel\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"startDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"endDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"displayFlag\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"status\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"likesCount\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"commentsCount\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"comments\",\"kind\":\"object\",\"type\":\"Comment\",\"relationName\":\"CommentToUnit\"},{\"name\":\"logs\",\"kind\":\"object\",\"type\":\"Log\",\"relationName\":\"LogToUnit\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"UnitToUser\"},{\"name\":\"unitLikes\",\"kind\":\"object\",\"type\":\"UnitLike\",\"relationName\":\"UnitToUnitLike\"},{\"name\":\"unitTags\",\"kind\":\"object\",\"type\":\"UnitTag\",\"relationName\":\"UnitToUnitTag\"}],\"dbName\":null},\"Log\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"unitId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"learningTime\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"note\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"logDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"effectScore\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"effectType\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"unit\",\"kind\":\"object\",\"type\":\"Unit\",\"relationName\":\"LogToUnit\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"LogToUser\"},{\"name\":\"logTags\",\"kind\":\"object\",\"type\":\"LogTag\",\"relationName\":\"LogToLogTag\"},{\"name\":\"resources\",\"kind\":\"object\",\"type\":\"Resource\",\"relationName\":\"LogToResource\"}],\"dbName\":null},\"Resource\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"logId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"resourceType\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"resourceLink\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"fileName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"filePath\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"log\",\"kind\":\"object\",\"type\":\"Log\",\"relationName\":\"LogToResource\"}],\"dbName\":null},\"Tag\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"logTags\",\"kind\":\"object\",\"type\":\"LogTag\",\"relationName\":\"LogTagToTag\"},{\"name\":\"unitTags\",\"kind\":\"object\",\"type\":\"UnitTag\",\"relationName\":\"TagToUnitTag\"},{\"name\":\"userInterests\",\"kind\":\"object\",\"type\":\"UserInterest\",\"relationName\":\"TagToUserInterest\"},{\"name\":\"userSkills\",\"kind\":\"object\",\"type\":\"UserSkill\",\"relationName\":\"TagToUserSkill\"}],\"dbName\":null},\"UnitTag\":{\"fields\":[{\"name\":\"unitId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"tagId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"tag\",\"kind\":\"object\",\"type\":\"Tag\",\"relationName\":\"TagToUnitTag\"},{\"name\":\"unit\",\"kind\":\"object\",\"type\":\"Unit\",\"relationName\":\"UnitToUnitTag\"}],\"dbName\":null},\"LogTag\":{\"fields\":[{\"name\":\"logId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"tagId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"log\",\"kind\":\"object\",\"type\":\"Log\",\"relationName\":\"LogToLogTag\"},{\"name\":\"tag\",\"kind\":\"object\",\"type\":\"Tag\",\"relationName\":\"LogTagToTag\"}],\"dbName\":null},\"UserSkill\":{\"fields\":[{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"tagId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"tag\",\"kind\":\"object\",\"type\":\"Tag\",\"relationName\":\"TagToUserSkill\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"UserToUserSkill\"}],\"dbName\":null},\"UserInterest\":{\"fields\":[{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"tagId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"tag\",\"kind\":\"object\",\"type\":\"Tag\",\"relationName\":\"TagToUserInterest\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"UserToUserInterest\"}],\"dbName\":null},\"UnitLike\":{\"fields\":[{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"unitId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"unit\",\"kind\":\"object\",\"type\":\"Unit\",\"relationName\":\"UnitToUnitLike\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"UnitLikeToUser\"}],\"dbName\":null},\"Comment\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"unitId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"comment\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"unit\",\"kind\":\"object\",\"type\":\"Unit\",\"relationName\":\"CommentToUnit\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"CommentToUser\"}],\"dbName\":null},\"Account\":{\"fields\":[{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"provider\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"providerAccountId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"refresh_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"access_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires_at\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"token_type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"scope\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"id_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"session_state\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"AccountToUser\"}],\"dbName\":null},\"Session\":{\"fields\":[{\"name\":\"sessionToken\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"SessionToUser\"}],\"dbName\":null},\"VerificationToken\":{\"fields\":[{\"name\":\"identifier\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"ErrorLog\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"message\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"stack\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"digest\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"url\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userAgent\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"timestamp\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null}},\"enums\":{},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = {
  getRuntime: async () => require('./query_engine_bg.js'),
  getQueryEngineWasmModule: async () => {
    const loader = (await import('#wasm-engine-loader')).default
    const engine = (await loader).default
    return engine
  }
}
config.compilerWasm = undefined

config.injectableEdgeEnv = () => ({
  parsed: {
    DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

