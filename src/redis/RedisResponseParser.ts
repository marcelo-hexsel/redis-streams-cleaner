export class RedisResponseParser {
  public parse(rawStructure: Array<unknown>): unknown {
    const parsedObject = {};

    for (let i = 0; i < rawStructure.length; i += 2) {
      const propertyName = rawStructure[i] as string;
      let propertyValue = rawStructure[i + 1];

      if (Array.isArray(propertyValue) && (propertyValue as Array<unknown>).length > 0) {
        if (Array.isArray(propertyValue[0])) {
          propertyValue = propertyValue.map((v) => {
            return this.parse(v);
          });
        } else {
          propertyValue = this.parse(propertyValue);
        }
      }

      parsedObject[propertyName] = propertyValue;
    }

    return parsedObject;
  }
}
