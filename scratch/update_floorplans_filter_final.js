const fs = require('fs');
const filePath = 'e:\\Webearl\\99acres\\controllers\\property.controller.js';
let content = fs.readFileSync(filePath, 'utf8');

// Use more flexible regex to match the blocks
content = content.replace(
    /if\s*\(req\.user\.role\s*!==\s*'builder'\s*&&\s*req\.user\.role\s*!==\s*'admin'\)\s*\{\s*delete\s+req\.body\.availableUnits;\s*delete\s+req\.body\.developer;\s*\}/g,
    `if (req.user.role !== 'builder' && req.user.role !== 'admin') {
            delete req.body.availableUnits;
            delete req.body.developer;
            delete req.body.floorPlans;
        }`
);

content = content.replace(
    /if\s*\(req\.user\.role\s*!==\s*'builder'\s*&&\s*req\.user\.role\s*!==\s*'admin'\)\s*\{\s*delete\s+propertyObj\.availableUnits;\s*delete\s+propertyObj\.developer;\s*\}/g,
    `if (req.user.role !== 'builder' && req.user.role !== 'admin') {
            delete propertyObj.availableUnits;
            delete propertyObj.developer;
            delete propertyObj.floorPlans;
        }`
);

fs.writeFileSync(filePath, content);
console.log('Update successful for floorPlans filtering');
