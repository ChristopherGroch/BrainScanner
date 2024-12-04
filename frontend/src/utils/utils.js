export function parseErrorsFromString(errorString) {
  try {
    console.log(errorString);
    let sanitizedString = errorString
      .replace(/ErrorDetail\([^)]+\)/g, (match) => {
        const innerMatch = match.match(/string='([^']+)'/);
        return innerMatch ? `"${innerMatch[1]}"` : '"An error occurred"';
      })
      .replace(/'/g, '"');
    console.log(sanitizedString);
    const indexOfClosingBrace = sanitizedString.indexOf('}');
    let afterClosingBrace = ''
    if (indexOfClosingBrace !== -1) {
      afterClosingBrace = sanitizedString.slice(indexOfClosingBrace + 1);
      sanitizedString = sanitizedString.slice(0, indexOfClosingBrace + 1);
    }
    console.log(sanitizedString);
    const errorObject = JSON.parse(sanitizedString);
    if (afterClosingBrace !== ''){
      errorObject['Patient'] = [afterClosingBrace]
    }
    const parsedErrors = {};
    Object.keys(errorObject).forEach((field) => {
      const errorsForField = errorObject[field];
      parsedErrors[field] = Array.isArray(errorsForField)
        ? errorsForField[0]
        : "An error occurred.";
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
export function containsBraces(str) {
  return /{.*?}/.test(str);
}
