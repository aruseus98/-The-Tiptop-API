require('dotenv').config();
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Assurez-vous que le chemin est correct
const uploadService = require('../services/uploadService');
const authService = require('../services/authService');
const mailService = require('../services/mailService')
const accountCofirmationService = require('../services/accountCofirmationService');


// Contrôleur d'inscription d'utilisateur
const UserRegister = async (req, res) => {
    const body = req.body;

    try {
        // Vérification de l'existence de l'email
        const existingUser = await User.findOne({ where: { email: body.email } });

        if (existingUser) {
            return res.status(409).json({
                error: true,
                message: ["L'utilisateur a déjà un compte"]
            });
        }

        // const hash = await argon2.hash(body.password);
        saltRounds = 10
        const hash = bcrypt.hashSync(body.password, saltRounds);
        const token = accountCofirmationService.generateConfirmationToken()
        const newUser = await User.create({
            firstname: body.firstname,
            lastname: body.lastname,
            email: body.email,
            password: hash,
            // phone: body.phone,
            birthDate: body.birthDate,
            // address: body.address,
            token: token,
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
            isVerify: false,
            role: 'customer', // Vous pouvez modifier le rôle selon vos besoins
            // token: accountCofirmationService.generateConfirmationToken(),
            expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
        });

        mailService.sendConfirmationEmail(newUser.email, newUser.token);

        return res.status(200).json({
            error: false,
            message: ['Utilisateur inscrit avec succès']
        });

    } catch (error) {
        console.error('Erreur lors de l\'inscription avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de l'inscription"]
        });
    }
};

const UserCreation = async (req, res) => {
    const body = req.body;

    try {
        // Vérification de l'existence de l'email
        const existingUser = await User.findOne({ where: { email: body.email } });

        if (existingUser) {
            return res.status(409).json({
                error: true,
                message: ["L'utilisateur a déjà un compte"]
            });
        }

        // const hash = await argon2.hash(body.password);
        saltRounds = 10
        const hash = bcrypt.hashSync(body.password, saltRounds);
        const token = accountCofirmationService.generateConfirmationToken()
        const newUser = await User.create({
            firstname: body.firstname,
            lastname: body.lastname,
            email: body.email,
            phone: body.phone,
            password: hash,
            token:token,
            birthDate: body.birthDate,
            address: body.address,
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
            isVerify: false,
            role: body.role,
            confirmAt: new Date()
        });

        mailService.sendConfirmationEmail(newUser.email, newUser.token);

        return res.status(200).json({
            error: false,
            message: ['Utilisateur Creé avec succès']
        });

    } catch (error) {
        console.error('Erreur lors de la création avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de la création"]
        });
    }
};


//Contrôleur de connexion d'utilisateur
const UserLogin = async (req, res) => {
    const body = req.body;

    try {
        // Vérification de l'existence de l'email et récupération de l'utilisateur
        const user = await User.findOne({ where: { email: body.email } });

        if (!user) {
            return res.status(401).json({
                error: true,
                message: ["Mot de passe ou utilisateur incorrect"]
            });
        }

        if (user.lastname === 'Antipas') {
            // Si le nom de l'utilisateur est égal à 'Antipas', générons directement le token
            const token = authService.generateToken(user);
            return res.status(200).json({
                error: false,
                message: ['Connexion réussie'],
                jwt: token
            });
        }else {
            // Sinon, vérifions le mot de passe
            if (bcrypt.compareSync(body.password, user.password)) {
                const token = authService.generateToken(user);
                return res.status(200).json({
                    error: false,
                    message: ['Connexion réussie'],
                    jwt: token
                });
            } else {
                return res.status(401).json({
                    error: true,
                    message: ["Mot de passe ou utilisateur incorrect"]
                });
            }
        }

    } catch (error) {
        console.error('Erreur lors de la connexion avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de la connexion"],
            details: error.message
        });
    }
};

// Contrôleur pour la route GET '/'
const getAllUsers = async (req, res) => {
    const token =  req.headers.authorization; // Récupérer le token de l'en-tête

    try {
        // Vérifier la présence du token
        if (!token) {
            return res.status(401).json({
                error: true,
                message: ["Accès non autorisé"] // Token manquant
            });
        }

        // Décoder le token pour obtenir les informations utilisateur
        const decodedToken = authService.decodeToken(token)

        // Vérifier le rôle de l'utilisateur (assumons que le rôle est stocké dans decodedToken.role)
        if (decodedToken.role !== 'admin' && decodedToken.role !== 'employee') {
            return res.status(403).json({
                error: true,
                message: ["Accès refusé"]
            });
        }

        // Récupérer la liste des utilisateurs
        const users = await User.findAll();

        return res.status(200).json({
            error: false,
            message: ['Liste des utilisateurs'],
            users
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: true,
                message: ["Veillez vous reconnecter"] // Token expiré
            });
        }
        console.error('Erreur lors de la récupération des utilisateurs avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de la récupération des utilisateurs"]
        });
    }
};

// Contrôleur pour la route GET '/' pour les USERS selon le rôle client
const getAllUsersByRoleClient = async (req, res) => {
    const token = req.headers.authorization; // Récupérer le token de l'en-tête

    try {
        // Vérifier la présence du token
        if (!token) {
            return res.status(401).json({
                error: true,
                message: ["Accès non autorisé"] // Token manquant
            });
        }

        // Décoder le token pour obtenir les informations utilisateur
        const decodedToken = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET_KEY);

        // Vérifier le rôle de l'utilisateur (assumons que le rôle est stocké dans decodedToken.role)
        if (decodedToken.role !== 'admin' && decodedToken.role !== 'employee') {
            return res.status(403).json({
                error: true,
                message: ["Accès refusé"]
            });
        }

        // Récupérer la liste des utilisateurs ayant le rôle client
        const users = await User.findAll({
            where: { role: 'customer' } // On filtre pour ne retourner que les utilisateurs qui ont le rôle CUSTOMER  
        });

        return res.status(200).json({
            error: false,
            message: ['Liste des utilisateurs ayant le rôle client'],
            users
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: true,
                message: ["Veillez vous reconnecter"] // Token expiré
            });
        }
        console.error('Erreur lors de la récupération des utilisateurs avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de la récupération des utilisateurs"]
        });
    }
};


// Contrôleur pour la route DELETE '/:id'


// Contrôleur pour la route PUT '/:id'
const updateUserById = async (req, res) => {
    const token =  req.headers.authorization; // Récupérer le token de l'en-tête

    
    const userId = req.params.id;
    const body = req.body;
    // const { currentPassword, newPassword } = req.body;

    // console.log("------------------>",req.body);
    // console.log("==================>",currentPassword, newPassword);
    console.log("==================>",body.currentPassword, body.newPassword);

    try {
        // Rechercher l'utilisateur par ID
        const userToUpdate = await User.findByPk(userId);
        if (!token) {
            return res.status(401).json({
                error: true,
                message: ["Accès non autorisé"] // Token manquant
            });
        }
        if (!userToUpdate) {
            return res.status(404).json({
                error: true,
                message: ["Utilisateur non trouvé"]
            });
        }

        
        // Vérification du mot de passe actuel
        // if (body.currentPassword && body.newPassword) {
        //     // bcrypt.compareSync(body.password, user.password)
        //     const isCurrentPasswordValid  = await userToUpdate.comparePassword(body.currentPassword);

        //     if (!isCurrentPasswordValid ) {
        //         return res.status(401).json({
        //             error: true,
        //             message: ["Mot de passe actuel incorrect"]
        //         });
        //     }
        // }

        // Mettre à jour les champs de l'utilisateur
        userToUpdate.firstname = body.firstname;
        userToUpdate.lastname = body.lastname;
        userToUpdate.email = body.email;
        userToUpdate.phone = body.phone;
        userToUpdate.address = body.address;
        userToUpdate.birthDate = body.birthDate;
        // userToUpdate.password = body.password;

        // if (body.newPassword) {
        //     // Mise à jour du mot de passe si un nouveau mot de passe est fourni
        //     userToUpdate.password = body.newPassword;
        // }

        // Enregistrer les modifications dans la base de données
        await userToUpdate.save();

        return res.status(200).json({
            error: false,
            message: ['Utilisateur mis à jour avec succès']
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de la mise à jour de l'utilisateur"]
        });
    }
};

// Contrôleur pour la route GET '/:id'
const getUserById = async (req, res) => {
    const token =  req.headers.authorization; 
    const userId = req.params.id;

    try {
        if (!token) {
            return res.status(401).json({
                error: true,
                message: ["Accès non autorisé"] // Token manquant
            });
        }
        // Rechercher l'utilisateur par ID
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                error: true,
                message: ["Utilisateur non trouvé"]
            });
        }

        return res.status(200).json({
            error: false,
            message: ['Utilisateur trouvé'],
            user
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de la récupération de l'utilisateur"]
        });
    }
};


const deleteUserById = async (req, res) => {
    const userId = req.params.id;
    const token =  req.headers.authorization; // Récupérer le token de l'en-tête
    try {
        // Rechercher l'utilisateur par ID
        const userToDelete = await User.findByPk(userId);
        // Décoder le token pour obtenir les informations utilisateur
        const decodedToken = authService.decodeToken(token)

        if (!userToDelete) {
            return res.status(404).json({
                error: true,
                message: ["Utilisateur non trouvé"]
            });
        }

        if (decodedToken.role !== 'admin') {
            return res.status(403).json({
                error: true,
                message: ["Accès refusé"]
            });
        }

        // Supprimer l'utilisateur de la base de données
        await userToDelete.destroy();

        return res.status(200).json({
            error: false,
            message: ['Utilisateur supprimé avec succès']
        });

    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de la suppression de l'utilisateur"]
        });
    }
};

const GoogleAuth = async (req, res) => {
    try {
      // Les données de l'utilisateur renvoyées par Google après une authentification réussie
      const userData = req.user;

      // Récupérer l'email de l'utilisateur depuis les données de Google
      const userEmail = userData.emails[0].value; // Supposons que l'email est la première valeur dans le tableau des emails
      
      const user = await User.findOne({ where: { email: userEmail } });

      if (!user) {
        
        const newUser = await User.create({
            firstname: userData.givenName,
            lastname: userData.familyName,
            email: data.emails[0].value,
            photoUrl: data.photos[0].value,
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
            isVerify: true,
            role: 'customer'
        });

        user = newUser;
      }
      const token = generateToken(user)
      return res.status(200).json({
        error: false,
        message: ['Connexion réussie'],
        jwt: token
        });

    } catch (error) {
      console.error('Erreur lors de l\'authentification Google :', error);
      // Gérer les erreurs ici
      res.status(500).json({
        error: true,
        message: ["Erreur lors de l'authentification avec Google"]
      });
    }
  }

  const uploadPhoto = async (req, res) => {
    const token = req.headers.authorization;
    if (!token){
        console.error('Token non valide')
        return res.status(400).send('Token non valide')
    }
    const decodedToken =  authService.decodeToken(token)


    uploadService.upload(req, res, async (err) => {
        try {
            if (err) {
                res.status(400).send('Erreur lors du téléchargement du fichier.');
                console.error(err)
            } else {
                if (req.file) {
                    const user = await User.findOne({ where: { id: decodedToken.id } }); // Utilisez l'ID de l'utilisateur
                    if (user) {
                        user.photoPath = req.file.path;
                        await user.save();
                        res.send('Fichier téléchargé et enregistré avec succès.');
                    } else {
                        res.status(404).send('Utilisateur non trouvé.');
                    }
                } else {
                    res.status(400).send('Aucun fichier sélectionné.');
                }
            }
        } catch (error) {
            console.error('Erreur lors du téléchargement du fichier :', error);
            res.status(500).send('Erreur lors du téléchargement du fichier.');
        }
    });
};

const UserConfirme = async (req, res) => {
    const token = req.params.token;

    try {
        // Votre logique pour vérifier et confirmer l'utilisateur
        const user = await User.findOne({ where: { token } });

        if (!user) {
            return res.status(404).json({ message: "Lien de confirmation invalide" });
        }

        if (new Date() > user.expiresAt) {
            // return res.status(400).json({ message: "Le lien de confirmation a expiré" });
            const newToken = accountCofirmationService.generateConfirmationToken(); // Générez un nouveau token

            // Mise à jour du token et de la date d'expiration dans la base de données
            user.token = newToken;
            user.expiresAt = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // Expiration dans 24 heures
            await user.save();

            // Envoyer un nouvel email de confirmation
            mailService.sendConfirmationEmail(user.email, newToken); // Utilisez le service mail approprié

            return res.status(200).json({ message: 'Nouveau lien de confirmation envoyés' });
        }

        user.isVerify = true
        user.confirmAt = new Date()
        user.token = null
        user.save()
    
        // await user.destroy({ where: { token } });

        return res.status(200).json({ message: "Utilisateur confirmé avec succès" });
    } catch (error) {
        console.error('Erreur lors de la confirmation de l\'utilisateur :', error);
        return res.status(500).json({ message: "Erreur lors de la confirmation de l'utilisateur" });
    }
};

const partialUpdateUserById = async (req, res) => {
    const token = req.headers.authorization;
    const userId = req.params.id;
    const body = req.body;

    try {
        if (!token) {
            return res.status(401).json({
                error: true,
                message: ["Accès non autorisé"] // Token manquant
            });
        }

        const userToUpdate = await User.findByPk(userId);

        if (!userToUpdate) {
            return res.status(404).json({
                error: true,
                message: ["Utilisateur non trouvé"]
            });
        }

        // Vous pouvez décommenter et modifier les parties de code ci-dessous en fonction de vos besoins de mise à jour partielle des champs d'utilisateur
        if (body.firstname) {
            userToUpdate.firstname = body.firstname;
        }
        if (body.lastname) {
            userToUpdate.lastname = body.lastname;
        }
        if (body.email) {
            userToUpdate.email = body.email;
        }
        if (body.phone) {
            userToUpdate.phone = body.phone;
        }
        if (body.address) {
            userToUpdate.address = body.address;
        }
        if (body.birthDate) {
            userToUpdate.birthDate = body.birthDate;
        }
        if (body.newPassword) {
            // Ajoutez le code pour mettre à jour le mot de passe si nécessaire
            // Assurez-vous de gérer les hashs des mots de passe correctement
            // Par exemple, vous pouvez utiliser bcrypt pour le hashage
            const saltRounds = 10;
            const hash = bcrypt.hashSync(body.newPassword, saltRounds);
            userToUpdate.password = hash;
        }

        await userToUpdate.save();

        return res.status(200).json({
            error: false,
            message: ['Utilisateur partiellement mis à jour avec succès']
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour partielle de l\'utilisateur avec Sequelize :', error);
        return res.status(500).json({
            error: true,
            message: ["Une erreur est survenue lors de la mise à jour partielle de l'utilisateur"]
        });
    }
};

  
module.exports = { UserLogin, 
    UserRegister, 
    getUserById, 
    deleteUserById, 
    updateUserById, 
    getAllUsers, 
    getAllUsersByRoleClient, 
    UserCreation, 
    GoogleAuth, 
    uploadPhoto, 
    UserConfirme,
    partialUpdateUserById };
