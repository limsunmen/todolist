const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();
const port = process.env.PORT || 3000;

const day = date.getDate();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const uri = "mongodb+srv://sunmenlim:MKtoazd9ni3MBnRX@cluster0.v514dr0.mongodb.net/todolistDB";


// mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true});
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true,})


const itemsShema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
})

const Item = mongoose.model('Item', itemsShema);

const item1 = new Item({
  name: "Welcome to your todolist"
})
const item2 = new Item({
  name: "Hit the + button to add new Item"
})
const item3 = new Item({
  name: "<-- Hit this to delete an item"
})
const defaultItem = [item1,item2,item3]

const listSchema = {
  name: String,
  lists: [itemsShema]
}

const List = mongoose.model("List",listSchema)

async function insert(item){
  try {
    const result = await Item.insertMany(item)
  }catch(err){
    console.log(err)
  }
}


app.get("/", function(req, res) {

  async function find(){
    try {
      const result = await Item.find({},"name").exec()
      if(result.length === 0){
        insert(defaultItem)
        res.redirect("/")
      }else{
        res.render("list", {listTitle: day, newListItems: result});
      }
    } catch (err) {
      console.log(err)
    }
  }
  find()

});

app.get("/:todolist",function(req,res){
  const costumeList = _.lowerCase(req.params.todolist);

  const list = new List({
    name: costumeList,
    lists: defaultItem
  })

  List.find({name: costumeList})
    .then(function(result){
      if(result.length === 0){
        list.save()
        List.find({name: costumeList})
        .then(function(result){
          res.render("list", {listTitle: _.upperFirst(costumeList), newListItems: result[0].lists});
        })
      }else{
        if(result[0].lists.length === 0){

        }
        res.render("list", {listTitle: _.upperFirst(costumeList), newListItems: result[0].lists});
      }
    })
    .catch(function(err){
      console.log(err)
    })
})

app.post("/", function(req, res){
  const newTitle = req.body.title
  const newInsert = new Item({
    name: req.body.newItem
  })

  if(newTitle === day){
    if(newInsert.name !== ""){
      newInsert.save()
    }
    res.redirect("/");
  }else{
    List.findOne({name: _.lowerCase(newTitle)})
      .then(function(result){
        if(newInsert.name.length > 1){
          result.lists.push(newInsert);
          return result.save()
        }
      })
      .then(function(){
        res.redirect("/" + _.lowerCase(newTitle));
      })
      .catch(function(err){
        console.log(err);
      })
  }
});


app.post("/delete",function(req, res){
  const idItem = req.body.checkbox
  const title = req.body.title
  if(title === day){
    Item.findOneAndDelete({_id: idItem})
    .then(function(result){
      res.redirect("/")
    })
    .catch(function(err){
      console.log(err)
    })
  }else{
    List.findOneAndUpdate(
      { "lists._id": idItem },
      { $pull: { lists: { _id: idItem } } },
      { new: true }
    )
      .then(function(result){
        res.redirect(result.name)
      })
      .catch(function(err){
        console.log(err)
      })
  }

})

app.listen(port, function() {
  console.log("Server started on port 3000");
});
