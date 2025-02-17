db.bank.insertMany([
  {name: "Brian Kim", date_of_birth: new Date("1948-09-23"), balance: 1500},
  {name: "Karen Johnson", date_of_birth: new Date("1989-11-18"), balance: 4853},
  {name: "Wade Feinstein", date_of_birth: new Date("1965-02-25"), balance: 2150}
]);

db.bank.find();

db.bank.find({_id: ObjectId('66e02de6107a0497244ec05e')});

db.bank.find({date_of_birth: {$gt: new Date("1950-12-31")}});

db.bank.updateMany({}, {$inc: {balance: -100}});

db.bank.insertOne(
  {name: "Jon Smith", birth_date: new Date("1991-04-04"), balance: 500}
);
