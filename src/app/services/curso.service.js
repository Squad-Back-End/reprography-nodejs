//Inicializando as models e as recebendo
const { initModels } = require("../models/init-models");
var { curso } = initModels(sequelize);

module.exports = {

    findAllCourses: async (enabled) => {
       const cursos = await curso.findAll({
           where: { ativado: enabled }
        });

       return cursos;
    },

    findCourseByPk: async (id) => {
        const cursos = await curso.findByPk(id);

        return cursos;
    },

    createCourse: async ({ params }) => {
        const cursos = await curso.create(params);

        return cursos;
    },

    updateCourse: async ({ course, param }) => {
        const updated = await course.update(param);
        return updated;
    },

    destroyCourse: async () => {
        return "Método não implementado!";
    },
};