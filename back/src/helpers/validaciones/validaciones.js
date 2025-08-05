import { StatusCodes } from 'http-status-codes';
export class validaciones {
    chequearSiExiste = async(result, nombreCampo) => {
        if (result.rowCount === 0) {
            throw new Error(`${nombreCampo} es inexistente`);
        }
    }
    
    isValidEmail = async(email) => {
        let re = /^[^@]+@[^@]+\.[^@]+$/;
    if (!email || typeof email !== 'string' || !re.test(email)) {
            throw new Error('Invalido');
        }
        return true;
    }

    isValidString = async(string, nombreCampo) => {
        if (!string || typeof string !== 'string' || string.trim() === '' || string.length < 3) {
            throw new Error(`campo ${nombreCampo} no valida`);
        }
        return true;
    }

    isPositivo = async(value, nombreCampo) => {
        if (value === undefined || value <= 0 || isNaN(value)) {
            throw new Error(`${nombreCampo} tiene que ser positivo`);
        }
        return true;
    }
    isNumValido = async(value, nombreCampo, defaultValue) => {
        if (value === undefined || value <= 0 || isNaN(value)) {
            throw new Error(`${nombreCampo} es invalido`);
        }
        return true;
        
    }



} 


