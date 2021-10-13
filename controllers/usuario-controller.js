//Biblioteca do sequelize 
const Sequelize = require("sequelize");
//Operadores do sequelize
const Op = Sequelize.Op;
//Arquivo de config
const config = require("../.config/auth.config.json");

//Inicializando as models e as recebendo
const { initModels } = require("../models/init-models")
var { usuario, tipo_usuario } = initModels(sequelize)

//Usado para criptografar as senhas no banco -> Nesse caso para comparar a senha 
//quando o usuário solicitar mudança de senha.
const bcrypt = require("bcrypt");

//Usado para enviar o token e informações do usuário pro front quando ele Logar
const { sign } = require("jsonwebtoken");


//Funções do usuário 
module.exports = {

    //Usuários 

    //Logar
    logar: (req, res) => {

        const { email, senha } = req.body;

        usuario.findOne({
            where: {
                email: email
            },
        })
            .then(user => {
                if (!user) {
                    return res.json({ status: 'error', error: "E-mail ou Senha Inválidos!" })
                };
                console.log(user)

                bcrypt.compare(senha, user.senha).then((match) => {
                    if (!match) {
                        return res.json({
                            accessToken: null,
                            error: "E-mail ou Senha Inválidos!"
                        });
                    };

                    var token = sign({ nif: user.nif, email: user.email, nome: user.nome }, config.jwt.secret, {
                        expiresIn: 86400 // 24 hours
                    });

                    var authorities = [];
                    user.getRoles().then(roles => {
                        for (let i = 0; i < roles.length; i++) {
                            authorities.push(roles[i].id + "_ROLE_" + roles[i].descricao.toUpperCase());
                        }
                        res.status(200).json({
                            nif: user.nif,
                            nome: user.nome,
                            email: user.email,
                            roles: authorities,
                            accessToken: token
                        });
                    });
                });
            })
            .catch(err => {
                res.status(500).json({ error: err.message });
            });
    },

    informacoesBasicas: async (req, res) => {
        let usuarios = await usuario.findByPk(req.user.nif, {
            attributes: { exclude: ["senha"] },
        });

        res.json(usuarios);
    },

    //Altera 
    alterarPorNif: async (req, res) => {
        let { nome, telefone, depto, email, cfp, imagem } = req.body;

        imagem = 'uploads/user-img/default/usuario.png';

        if (req.file) {
            imagem = req.file.path;
        }

        await usuario.update(
            { nome, telefone, depto, email, cfp, imagem },
            {
                where: { nif: req.user.nif },
            }
        );

        res.status(200).json({ message: `Sua conta foi atualizada com sucesso!!` });
    },

    //Usuário pode excluir a própria conta (exclui pelo nif do usuário logado)
    excluirPorNif: async (req, res) => {
        await usuario.destroy({
            where: {
                nif: req.user.nif,
            },
        });

        res.status(200).json({ message: `Sua conta foi excluida com sucesso!!` });
    },

    mudarSenha: async (req, res) => {
        const { senhaAntiga, senhaNova } = req.body;

        await usuario.findOne({
            where: {
                nif: req.user.nif
            },
        }).then(user => {
            bcrypt.compare(senhaAntiga, user.senha).then((match) => {
                if (!match) return res.json({ error: "Senha inserida está incorreta" });

                bcrypt.hash(senhaNova, 10, function (err, hash) {
                    if (err) throw (err);
                    usuario.update(
                        { senha: hash },
                        { where: { nif: req.user.nif } }
                    );
                    res.json({ message: "Sua senha foi atualizada com sucesso!!" });
                });
            });
        });
    },

    //Gerentes --- (ADMIN)

//Registrar usuário
    adicionarUsuario: (req, res) => {
        let { nif, senha, nome, telefone, depto, email, cfp, imagem, admin } = req.body;

        //Imagem padrão caso não seja inserida nenhuma imagem.
        imagem = 'uploads/user-img/default/usuario.png';

        if (req.file) {
            imagem = req.file.filename;
        }

        //Regra de negócio para Controle de Usuário -> Se Input de Roles for 1 (usuário for ADM)
        //Ele faz a busca de admin na tabela roles, e registra o id de Admin no usuário a ser criado 
        //na tabela user_roles
        if (admin == 1) {
            admin = ["admin"]
        }
        else {
            admin = ["user"]
        }

        bcrypt.hash(senha, config.jwt.saltRounds, function (err, hash) {
            if (err) throw (err);
            usuario.create({
                nif: nif,
                senha: hash,
                nome: nome,
                telefone: telefone,
                id_depto: depto,
                email: email,
                cfp: cfp,
                imagem: imagem
            })
                .then(user => {
                    if (admin) {
                        tipo_usuario.findAll({
                            where: {
                                descricao: {
                                    [Op.or]: admin
                                }
                            }
                        })
                            .then(roles => {
                                user.setRoles(roles)
                                // .then(roles => {
                                // res.status(200).send("User was registered successfully!");
                                // });

                            });
                    }
                    else {
                        // user role = 1
                        user.setRoles([1])
                        // .then(roles => {
                        // res.status(200).send({ message: "User was registered successfully!" });
                        // });
                    }
                    res.status(200).json({ message: `Usuário com nif ${nif} criado com sucesso!` });
                })
                .catch(err => {
                    res.status(500).json({ message: err.message });
                });
        })
    },

    buscarTodos: async (req, res) => {
        let usuarios = await usuario.findAll({
            include: [
                'roles'
            ]
        })
        res.json(usuarios)
    },

    buscarPorNome: async (req, res) => {
        const user = req.params.user;
        // const query = `%${req.query.search}`;
        let usuarios = await usuario.findAll({
            where: {
                nome: {
                    [Op.like]: `${user}%`
                }
            },
            include: [
                'roles'
            ],
            attributes: { exclude: ["senha"] }
        })
        res.json(usuarios)
    },

    buscarPorNif: async (req, res) => {
        let usuarios = await usuario.findAll({
            where: {
                nif: req.params.nif
            },
            include: [
                'roles'
            ],
        })
        res.json(usuarios)
    },

    alterarPorNif: async (req, res) => {
        let { nif, nome, senha, telefone, depto, email, cfp, admin, imagem } = req.body;

        imagem = 'uploads/user-img/default/usuario.png';

        if (req.file) {
            imagem = req.file.path;
        }

        if (admin == 1) {
            admin = ["admin"]
        }
        else {
            admin = ["user"]
        }
        bcrypt.hash(senha, 10, function (err, hash) {
            if (err) throw (err);
            usuario.update(
                { nif, nome, senha: hash, telefone, depto, email, cfp, roles: admin, imagem },
                {
                    where: { nif: req.params.nif },
                }
            )
            res.status(200).json({ message: `Sua conta foi atualizada com sucesso!!` });
        });
    },

    excluirPorNif: async (req, res) => {
        await usuario.destroy({
            where: {
                nif: req.params.nif
            },
        });
        res.status(200).json({ message: `Sua conta foi excluida com sucesso!!` });
    }
}