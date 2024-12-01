export function parseErrorsFromString(errorString) {
    try {
      const sanitizedString = errorString
        .replace(/ErrorDetail\([^)]+\)/g, (match) => {
          const innerMatch = match.match(/string='([^']+)'/);
          return innerMatch ? `"${innerMatch[1]}"` : '"An error occurred"';
        })
        .replace(/'/g, '"'); 
  
      
      const errorObject = JSON.parse(sanitizedString);
  
      const parsedErrors = {};
      Object.keys(errorObject).forEach((field) => {
        const errorsForField = errorObject[field];
        parsedErrors[field] = Array.isArray(errorsForField) ? errorsForField[0] : "An error occurred.";
      });
  
      return parsedErrors;
    } catch (e) {
      console.error("Error parsing error string:", e);
      return { general: "An unexpected error occurred." };
    }
  }

  export function formatErrorsToString(errorsObject) {
    let errorString = "";
  
    Object.keys(errorsObject).forEach((field) => {
      errorString += `${field}: ${errorsObject[field]}\n`; 
    });
  
    return errorString.trim();
  }