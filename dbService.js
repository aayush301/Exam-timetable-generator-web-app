const mysql= require('mysql');
require('dotenv').config();
const con= mysql.createConnection(
    {
	    host:process.env.host,
        user:process.env.user,
        password:process.env.password,
        database:process.env.database,
        port:process.env.port,
        multipleStatements:true
    }
    
);

con.connect(function(){
    console.log('db '+ con.state);
})

// Tables used in MySQL
// students(name varchar(20),English boolean);
// courses(course varchar(20));

const query1='create table if not exists students(name varchar(20))';
con.query(query1, function (err) {
    if(err) throw err;
});

const query2='create table if not exists courses(course varchar(80))';
con.query(query2, function (err) {
    if(err) throw err;
});


module.exports= con;
