const db = require('../models')

const createPost = (req, res) => {
    const { body, params } = req;
    const currentUser = body.user;
    // const currentUser = '5dd606570b907d02df17dc45'; // manual for testing!

    db.City.findOne({ slug: params.city_slug }, (err, foundCity) => {
        if (err) {
            return res.status(404).json({ err, message: 'city not found', });
        }
        const cityId = foundCity._id;
        const newPost = { ...body, user: currentUser, city: cityId };
        db.Post.create(newPost, (err, createdPost) => {
            if (err) return res.status(500).json({ err, message:'it broke' });
            res.status(201).json({
                message: 'success!',
                data: createdPost,
            });

            foundCity.posts.push(createdPost._id);
            foundCity.save((err) => {
                if (err) return console.log(err);
            })

            db.User.findById(currentUser, (err, user) => {
                if (err) return console.log(err)
                if(user){
                user.posts.push(createdPost._id)
                user.save((err,result)=>{
                    if (err) return console.log(err)
                    console.log(result)
                })}
            });
        });
    });
}

const getPost = (req,res) => {
    const _id = req.params.postId

    db.Post.findById(_id,(err,post)=> {
        if (err) return res.status(500).json({err})
        res.send({
            status:201,
            post,
        })
    })
}
const userPosts = (req,res) => {
    db.User.findById({_id:req.params.id}, (err,foundUser)=>{
        if (err) return res.status(500)
        if(foundUser){
          foundUser.populate("posts").execPopulate((err,user)=> {
              if (err) return res.status(500).json({err})
            res.send({status:200,posts:user.posts})
        })
    }
    else res.status(500).json({message:'user not found'})
})
}

const allPosts = (req,res) => {
   db.Post.find({},(err,posts)=>{
       if (err) res.status(500).json({err})

       res.send({posts})
   })
};

const deletePost = (req, res) => {
    const { postId } = req.params;
    db.User.findOne({ posts: postId }, (err, foundUser) => {
        if (err) return res.status(400).json({ err });
        if (foundUser) {
            const post = foundUser.posts.findIndex(p => p._id === postId);
            foundUser.posts.splice(post, 1);
            foundUser.save();
        }
    });
    db.Post.findOneAndDelete({ _id: postId }, (err, foundPost) => {
        if (err) return res.status(400).json({ err });
        res.status(200).json({
            deleted: foundPost,
        });
    });
};

module.exports = {
    createPost,
    allPosts,
    userPosts,
    getPost,
    deletePost,
}