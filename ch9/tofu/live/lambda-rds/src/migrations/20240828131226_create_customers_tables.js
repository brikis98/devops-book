exports.up = async (knex) => {             
  await knex.schema
    .createTable('customers', (table) => { 
      table.increments('id').primary();
      table.string('name', 128);
      table.date('date_of_birth');
      table.integer('balance');
    });

  return knex('customers').insert([        
    {name: 'Brian Kim', date_of_birth: '1948-09-23', balance: 1500},
    {name: 'Karen Johnson', date_of_birth: '1989-11-18', balance: 4853},
    {name: 'Wade Feinstein', date_of_birth: '1965-02-25', balance: 2150}
  ]);
}

exports.down = async (knex) => {           
  return knex.schema.dropTable('customers');
}
