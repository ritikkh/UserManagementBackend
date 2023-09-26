const users = require("../models/userSchema")
const moment = require("moment")
const csv = require("fast-csv")
const fs = require('fs');
const path = require("path")
const BASE_URL = process.env.BASE_URL

exports.userpost=async(req,res)=>{
 const file = req.file.filename;
 const {fname,lname,gender,mobile,status,location,email} = req.body;
 if(!file|| !fname|| !lname|| !gender|| !mobile|| !status|| !location|| !email){
    res.status(401).json("All inputs is required")
 }

 try{
    const peruser = await users.findOne({email:email});
    if(peruser){
        res.status(401).json("This user already registered")
    }
    else{
        const datecreated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss")
        console.log(datecreated)
        const userData = new users({
            fname,lname,gender,mobile,status,location,email,profile:file,datecreated
        });
        await userData.save();
        res.status(200).json(userData);
    }
 }
 catch(error){
    res.status(401).json(error);
    console.log("catch block error")
 }
};

exports.userget = async(req, res) =>{
    const search = req.query.search || ""
    const gender = req.query.gender || ""
    const status = req.query.status || ""
    const sort = req.query.sort
    const page = req.query.page || 1
    const ITEM_PER_PAGE = 2;

    const query = {fname:{$regex:search,$options:"i"}}
    if(gender!="All"){
        query.gender = gender
    }
    if(status!="All"){
        query.status = status
    }
    try{
        const skip = (page-1)*ITEM_PER_PAGE;
        const count = await users.countDocuments(query);
        const pageCount = Math.ceil(count/ITEM_PER_PAGE);
        const usersdata = await users.find(query).sort({datecreated:sort=="new"?-1:1}).limit(ITEM_PER_PAGE).skip(skip);
        res.status(200).json({
            Pagination:{count,pageCount},
            usersdata})
    }
    catch(error){
        res.status(401).json(error)
    }
};

exports.singleuserget = async(req, res) =>{
    const {id} = req.params;
    try{
        const usersdata = await users.findOne({_id:id});
        res.status(200).json(usersdata)
    }
    catch(error){
        res.status(401).json(error)
    }
};

exports.useredit = async(req, res) =>{
    const {id} = req.params;
    const {fname,lname,gender,mobile,status,location,email,user_profile} = req.body;
    const file = req.file ? req.file.filename : user_profile
    const dateUpdated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss")
    try{
        const updateuser = await users.findByIdAndUpdate({_id:id},{fname,lname,gender,mobile,status,location,email,profile:file,dateUpdated},{new:true});
        await updateuser.save();
        res.status(200).json(updateuser)
    }
    catch(error){
        res.status(401).json(error)
    }
};

exports.userdelete = async(req, res) =>{
    const {id} = req.params;
    try{
        const deleteuser = await users.findByIdAndDelete({_id:id});
        res.status(200).json(deleteuser)
    }
    catch(error){
        res.status(401).json(error)
    }
};

exports.userstatus = async(req, res) =>{
    const {id} = req.params;
    const {data} = req.body;
    const dateUpdated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss")
    try{
        const userstatusupdate = await users.findByIdAndUpdate({_id:id},{status:data},{new:true});
        // await userstatusupdate.save();
        res.status(200).json(userstatusupdate)
    }
    catch(error){
        res.status(401).json(error)
    }
};
exports.userExport = async (req, res) => {
    try {
        const usersdata = await users.find();
        const csvStream = csv.format({ headers: true });
        console.log("0is here")
        if (!fs.existsSync("public/files/export/")) {
            if (!fs.existsSync("public/files")) {
                console.log("1.0is here")
                fs.mkdirSync("public/files/",{ recursive: true });
                console.log("1is here")
            }
            if (!fs.existsSync("public/files/export")) {
                fs.mkdir("./public/files/export/");
                console.log("2is here")
            }
        }
        const writablestream = fs.createWriteStream(
            "public/files/export/users.csv"

        );
        csvStream.pipe(writablestream);
        writablestream.on("finish", function () {
            res.json({
                downloadUrl: `${BASE_URL}/files/export/users.csv`,
            });
        });
        if (usersdata.length > 0) {
            usersdata.map((user) => {
                csvStream.write({
                    FirstName: user.fname ? user.fname : "-",
                    LastName: user.lname ? user.lname : "-",
                    Email: user.email ? user.email : "-",
                    Phone: user.mobile ? user.mobile : "-",
                    Gender: user.gender ? user.gender : "-",
                    Status: user.status ? user.status : "-",
                    Profile: user.profile ? user.profile : "-",
                    Location: user.location ? user.location : "-",
                    DateCreated: user.datecreated ? user.datecreated : "-",
                    DateUpdated: user.dateUpdated ? user.dateUpdated : "-",
                })
            })
        }
        csvStream.end();
        writablestream.end();

    } catch (error) {
        res.status(401).json(error)
    }
}