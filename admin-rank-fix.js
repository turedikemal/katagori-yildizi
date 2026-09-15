// PERMANENT FIX: Category rank selection state/API chain

// PROBLEM:
// 1. Select binding (line 137) passes undefined when empty → confusing nextManual logic
// 2. Line 144-145 nextManual calculation broken:
//    - If user selects Otomatik (empty): manualRank=undefined
//    - Condition: product.manual ? product.rank : null (wrong!)
//    - Should be: always null when manualRank undefined, to CLEAR manual flag
// 3. After API save, state.categories updated from response
//    But API response might not have updated product.manual flag if backend doesn't return it

// SOLUTION:
// A. Fix select binding to pass explicit null for "Otomatik"
// B. Fix nextManual logic to be explicit: if manualRank===undefined, always set nextManual=null
// C. Add backend batch endpoints for bulk operations
// D. Add bulk buttons to renderCategories()

// PATCH LOCATIONS:
// Line 137: Change `el.value?Number(el.value):undefined` to `el.value?Number(el.value):null`
// Line 144: Change nextManual logic
//   FROM: const nextManual=manualRank===undefined?(product?.manual?Number(product.rank):null):(manualRank??null)
//   TO: const nextManual=manualRank===undefined?null:(manualRank===null?null:Number(manualRank))
// Line 145: product.manual=nextManual!=null; (keep but now works correctly with fixed nextManual)
// Line 149: Add bulk buttons to renderCategories HTML template

