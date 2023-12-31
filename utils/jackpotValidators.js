const Yup = require('yup');

const jackpotchema = Yup.object({
    dateClientGagant: Yup.date().required(),
    userId: Yup.number().required().positive().integer(),
    
});

const jackpotIdSchema = Yup.object({
    id: Yup.number().required().positive().integer()
});

module.exports = { jackpotchema, jackpotIdSchema};
