const express= require('express');
const app=express();
const bodyParser= require("body-parser");
const path=require('path');
const hbs=require("hbs");
const con= require('./dbService');
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,'public')));

app.set('view engine','hbs');
hbs.registerPartials(path.join(__dirname,"/views/partials"));
hbs.registerHelper('increment', index=> {return index+1;});


app.get('/courses', function(req,res){
    const query='select* from courses;';
    con.query(query,function (err,result) {
        if(err) throw err;
        res.render('courses',{
            courses: result
        })
    });
});

app.post('/addCourse', async function (req,res) {
    const course=req.body.course;
    const query1=`insert into courses values('${course}');`;
    const query2='alter table students add `'+course+ '` boolean default 0';
    con.query(query1+query2, [course], function (err,results) {
        if(err) throw err;
        res.redirect('/courses');
    });

})

app.get('/addStudent',function (req,res) {
    const query='select* from courses;';
    con.query(query,function (err,result) {
        if(err) throw err;
        res.render('addStudent',{
            courses: result
        })
    });
});

app.get('/students', function (req,res) {
    const query1='select* from courses;';
    const query2='select* from students;';
    con.query(query1+query2,function (err,results) {
        if(err) throw err;
        res.render('students',{
            courses: results[0],
            students: results[1]
        })
    });
    
});

app.post('/addStudent', async function (req,res) {
    const name=req.body.name;
    var coursesSelected=req.body.courses;
    var arr=[name];
    const query1='select* from courses;';
    const result=await new Promise(function(resolve,reject){
        con.query(query1, function(err,res){
            resolve(res);
        });
    });

    if(typeof(coursesSelected)=='string')       // if only one course is selected, then it will
        coursesSelected=[coursesSelected];      // be a string, so convert it into array
    // console.log(coursesSelected);

    for(i=0,j=0;i<result.length;i++)
    {
        if(result[i].course==coursesSelected[j])
        {
            arr.push(1);
            j++;
        }
        else
            arr.push(0);
    }

    var query2='insert into students values(?';
    for(i=0;i<result.length;i++)
        query2+=',?';
    query2+=')';
    
    const result2=await new Promise(function(resolve,reject){
        con.query(query2, arr, function(err,res){
            resolve(res);
        });
    });

    res.redirect('/students');
});



function hasEdge(adj,a,b)
{
    for(let i=0;i<adj[a].length;i++)
        if(adj[a][i]==b)
            return true;
    return false;
}

app.get('/generateTimeTable', function (req,res) {
    res.render('examTimeTable');
})

app.post('/generateTimeTable', async function (req,res) {
    const maxCourses=req.body.maxCourses;

    const query1='select* from courses';
    const courses=await new Promise(function(resolve,reject){
        con.query(query1, function(err,res){
            resolve(res);
        });
    });

    const query2='select* from students';
    const students=await new Promise(function(resolve,reject){
        con.query(query2, function(err,res){
            resolve(res);
        });
    });

    var adj=new Map();
    for(i=0;i<courses.length;i++)
        adj[i]=[];

    for(i=0; i<students.length; i++)
    {
        for(j=0;j<courses.length;j++)
        {
            const course=courses[j].course;
            if(students[i][course])
            {
                for(k=0;k<courses.length;k++)
                {
                    if(k!=j && students[i][courses[k].course] && !hasEdge(adj,j,k))
                        adj[j].push(k);
                }
            }
        }
    }

    // console.log(adj);
    var result=new Array(courses.length);
    graphColoring(adj,courses.length, result)
    // console.log(result);
    
    var coursesTimeTable=new Array(courses.length);
    for(i=0;i<courses.length;i++)
        coursesTimeTable[i]=[];
    for(let i=0; i<courses.length;i++)
    {
        coursesTimeTable[result[i]].push(courses[i].course);
    }

    coursesTimeTable.splice(coursesTimeTable.findIndex(courses=>courses.length==0));

    for(let i=0;i<coursesTimeTable.length;i++)
    {
        if(coursesTimeTable[i].length>maxCourses)
        {
            coursesTimeTable.push(coursesTimeTable[i].splice(maxCourses));
        }
        else
            coursesTimeTable[i].length=maxCourses;
    }

    // console.log(coursesTimeTable);
    coursesTimeTable.forEach(courses=>{
        let index= courses.findIndex(value=>value==undefined);
        if(index>0)
            courses.fill('', index);
    })
    // console.log(coursesTimeTable);

    res.render('examTimeTable',{
        coursesTimeTable: coursesTimeTable
    });

});

function graphColoring(adj,V,result)
{
    result[0]=0;
    for(let u=1;u<V;u++)
        result[u]=-1;
    var available=new Array(V);
    for(let i=0;i<V;i++)
        available[i]=true;
    for(let u=1;u<V;u++)
    {
        for(let i of adj[u])
            if(result[i]!=-1)
                available[result[i]]=false;
        let col;
        for(col=0;col<V;col++)
            if(available[col]!=false)
                break;
        result[u]=col;
        for(let i of adj[u])
            if(result[i]!=-1)
                available[result[i]]=true;
    }

}



app.listen(5000, function(){
    console.log("app is running");
});