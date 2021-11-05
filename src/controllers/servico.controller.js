const service = require("../services/servico.service");

const caMessage = "Serviço Capa&Acabamento";
const ctMessage = "Serviço Copia&Tamanho";
const typeError = "Insira um tipo de serviço existente.";

module.exports = {

    servicosGet: async (req, res) => {
        const { enabled } = req.params;

        const servicos = await service.findAllServicos(enabled);
        return res.json(servicos);
    },

    servicosGetByPk: async( req, res ) => {
        const { id, type } = req.params;

        const servicos = await service.findServicoByPk({type: type, id: id});

        return res.json(servicos);

    },

    servicosPost: async (req, res) => {
    const { descricao, quantidade, valor_unitario } = req.body;
    const { type } = req.params;

      if(quantidade !== "" || quantidade !== null){
        await service.createServico({ type: type, params: {descricao: descricao, quantidade: quantidade, valor_unitario: valor_unitario} })
        .then(servico => {
            var status = "ok";
            var okMessage = "criado com sucesso!";
            var errorMessage = "inválido!";

            if(type === "ca"){
                var message =  `${caMessage} ${okMessage}`;
            }
            else if(type ==="ct") {
                message = `${ctMessage} ${okMessage}`;
            }
            else{
                status = "error";
                message = `${typeError} Serviço ${servico.id_servico} ${errorMessage}`;
            }
            return res.json({ status: status, message: message})
        })
        }
        else{
            return res.json({ error: "Insira a quantidade do seu serviço!"})
        }
    },

    servicosPut: async (req, res) => {
        var { id, type } = req.params;
        var { quantidade, valor_unitario } = req.body;

        const servicos = await service.findServicoByPk({type, id}) //aqui temos que passar o type e o id, para ele buscar pela service.

        if (servicos === null) {
            return res.json({ message: "Não há nenhum serviço" });
        }
        else {
            await service.updateServico({servico: servicos, param: { quantidade, valor_unitario }}).then(servico => { //no update aqui temos que passar a array que recebemos do find...
                var status = "ok";
                var okMessage = "atualizado com sucesso!";
                var errorMessage = "inválido!";

                if(type === "ca"){
                    var message =  `${caMessage} ${okMessage}`;
                }
                else if(type ==="ct") {
                    message = `${ctMessage} ${okMessage}`;
                }
                else{
                    status = "error";
                    message = `${typeError} Serviço ${servico.id_servico} ${errorMessage}`;
                }
                return res.json({ status: status, message: message})
            })
        }
    },

    enableOrDisableServico: async (req, res) => {

        const { type, id, enable } = req.params;

        const servicos = await service.findServicoByPk({type, id})

        if (servicos == null) {
                    return res.status(404).json({ status: 'error', message: "Serviço não encontrado!" });
                }
            
                await service.updateServico({servico: servicos, param: { ativado: enable }});
            
                var status = "ok";
                var okMessage = "atualizado com sucesso!";
                var errorMessage = "inválido!";

                if(type === "ca"){
                    var message =  `Status do ${caMessage} ${okMessage}`;
                }
                else if(type ==="ct") {
                    message = `Status do ${ctMessage} ${okMessage}`;
                }
                else{
                    status = "error";
                    message = `${typeError} Serviço ${servico.id_servico} ${errorMessage}`;
                }
                return res.json({ status: status, message: message})
    }
}