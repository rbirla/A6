var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");
var Schema = mongoose.Schema;
var exports = module.exports = {};
mongoose.set('debug', true);

var userSchema =  new Schema({

    "userName"     : {"type" : String,
                      "unique" : true },

    "password"     :  String,

    "email"        :  String,

    "loginHistory" : [{  "dateTime" : Date,
                        "userAgent" :  String
                      }]

});



let User;

function isEmptyOrSpaces(str){ 
    return str === null || str.match(/^ *$/) !== null;
}

exports.initialize = function(){

    return new Promise(function(resolve, reject){

              
        let db = mongoose.createConnection("mongodb+srv://rbirla:bti325@cluster0.n5xnrkc.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true }); 
        
        db.on('error', function(err){ 
            reject("Mongo DB Database connection error");
        })

        db.once('open', function(){ 
            console.log("DB CONNECTION SUCCESSFUL ");
           User = db.model("users", userSchema);
            resolve("Database connection Successful");

        })

    })
  

};


    
exports.registerUser = function(userData){

    let errMsgs = [];
    

    return new Promise(function(resolve,reject){

        console.log("Register User Called");

        console.log(userData);

        if (isEmptyOrSpaces(userData.password)){ 
                errMsgs.push("Password 1 cannot be empty or only white spaces!");
        }

        if (isEmptyOrSpaces(userData.password2)){ 
            errMsgs.push("Password 2 cannot be empty or only white spaces!");
        }

        if (userData.password != userData.password2){
            errMsgs.push("Passwords must match!")
        }

        if (isEmptyOrSpaces(userData.userName)){ 
                errMsgs.push("Username cannot be empty or only white spaces!");
        }
        

        
        if (errMsgs.length > 0){
            reject(errMsgs);
        }
        else{
              
            console.log("No errors with registration page :)");

            var newUser = new User(userData);

            console.log("New user created ");
            console.log(newUser);


    bcrypt.genSalt(10, function(err, salt) { 
    bcrypt.hash(newUser.password, salt, function(er, hash) { 
        

        if (!er){

            newUser.password = hash;

            newUser.save((err) => {
                console.log("TEST");
            if(err) {
                reject(err);
            } else {
                    resolve();
            }
            
            });
        }
        else{
            reject("HASHING ERROR D:");
        }

    });
    });


            
        
  
        }

    })
}


exports.checkUser = function(userData){

    return new Promise(function(resolve,reject){

        User.findOne({userName : userData.userName}).exec().then(function(user){
            

           
            if (user){

                console.log("User Exist :3 !!!! !!!  !!!  !!")
                console.log("Passowrd : " + user.password);

                bcrypt.compare(userData.password, user.password).then(function(isMatch){

                    console.log("Comparing passowords !!!  !!! !")
                    if (isMatch == false){
                        console.log("Password Mismatch ):");
                        reject("Passwords do not match ): ");
                    }
                    else{ 
                        console.log("Password match :)");
                        

                        
                        
                        
                        console.log("Pushing back history now ");
                        user.loginHistory.push({dataTime : new Date().toString(), userAgent : userData.userAgent});
                        console.log("History has been updated :) ");
                  



                        User.update({userName : user.userName},  { $set: {loginHistory: user.loginHistory}}, 
                            { multi: false}).exec().then(function(){
                                console.log("USER LOGGED IN");
                                resolve(user);

                            }).catch(function(err){
                                    reject("There was an error verifying the user : " + err);
                            })

                    }

                 }).catch(function(err){
                     reject("Encryption Error : "  + err);
                 })





            }
            else{
               reject( userData.userName + " was not found in the database ):");
            }

        }).catch(function(err){

                reject("Unable to find user : " + userData.userName);

        });

    })

  


}