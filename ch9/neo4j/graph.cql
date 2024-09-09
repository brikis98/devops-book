CREATE
(yevgeniy { name: "Yevgeniy Brikman" }),
  (oreilly { name: "O'Reilly Media", industry: "publishing" }),
  (california { name: "California" }),
  (linkedin { name: "LinkedIn", industry: "social networking" }),
  (hello { name: "Hello Startup", yearPublished: 2015 })

CREATE
(yevgeniy)-[:WROTE]->(hello),
  (yevgeniy)-[:LIVES_IN]->(california),
  (yevgeniy)-[:WORKED_AT]->(linkedin),
  (oreilly)-[:PUBLISHED]->(hello),
  (oreilly)-[:HEADQUARTERED_IN]->(california),
  (linkedin)-[:HEADQUARTERED_IN]->(california)

MATCH (person)
WHERE person.name = "Yevgeniy Brikman"
RETURN person

(8 {name:"Yevgeniy Brikman"})

MATCH (company)-[:HEADQUARTERED_IN]->(location { name: "California" })
RETURN company

(9 {name:"O'Reilly Media", industry: "publishing"})
(10 {name:"LinkedIn", industry: "social networking"})

MATCH (book)<-[:WROTE]-(person)-[:LIVES_IN]->(location { name: "California" })
RETURN book

(11 {name:"Hello, Startup", yearPublished: 2015})
