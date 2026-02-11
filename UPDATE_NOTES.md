# AutoService Pro - Update Notes

## 🎉 New Features Added

### 1. Multiple Services Per Order
Orders now support **multiple services** instead of just one:
- Add unlimited services to a single order
- Each service has its own pricing, quantity, labor cost, and parts cost
- Remove individual services with trash icon
- Real-time total calculation as you add services

### 2. Service Catalog with Custom Options
Two ways to add services:
- **From Catalog**: Pre-defined services with default prices
  - Oil Change, Brake Replacement, Tire Rotation, etc.
  - Prices auto-populate from catalog
- **Custom Service**: Type any service on the fly
  - Full flexibility for unique services
  - Enter custom name, price, description

### 3. Detailed Service Tracking
Each service in an order tracks:
- **Service Name**: What was done
- **Description**: Additional details
- **Quantity**: How many (e.g., 4 tires)
- **Unit Price**: Price per unit
- **Labor Cost**: Your labor charge
- **Parts Cost**: Your parts expense (COGS)

### 4. Automatic Order Archiving
Orders are automatically organized by date:
- **Active Orders**: Created within last 24 hours
- **Archived Orders**: Older than 1 day
- Manual archive button: "Archive Old Orders"
- Unarchive feature to move orders back

### 5. Archive Management Page
New dedicated Archive page:
- View all archived orders
- Print archived order receipts
- Unarchive orders to active list
- Keep order history organized

## 📊 Updated Database Schema

### New Tables
**services** - Service catalog
```sql
- id
- name
- description  
- default_price
- timestamps
```

**order_items** - Services in an order
```sql
- id
- order_id (FK)
- service_name
- description
- quantity
- unit_price
- labor_cost
- parts_cost
- created_at
```

### Updated Orders Table
```sql
- id
- client_id (FK)
- car_id (FK)
- is_paid
- is_archived (NEW)
- archived_at (NEW)
- timestamps
```

### Removed from Orders
- services (text field) - replaced by order_items
- labor_cost - moved to order_items
- parts_cost - moved to order_items
- parts_sold - replaced by unit_price in order_items

## 🚀 How to Use New Features

### Creating Multi-Service Orders

1. **Click "Create Order"**
2. **Select client and vehicle**
3. **Add Services**:
   ```
   Service #1:
   - Select "Oil Change" from catalog
   - Quantity: 1
   - Unit Price: $49.99 (auto-filled)
   - Labor: $30
   - Parts: $25
   
   Service #2:
   - Click "Add Service"
   - Select "Custom Service"
   - Name: "Engine flush"
   - Quantity: 1
   - Unit Price: $89.99
   - Labor: $60
   - Parts: $35
   ```
4. **See live total**: $139.98
5. **Create order**

### Managing Services Catalog

Pre-loaded services:
- Oil Change - $49.99
- Brake Pad Replacement - $199.99
- Tire Rotation - $29.99
- Battery Replacement - $150.00
- And more...

Add your own in SQL:
```sql
INSERT INTO services (name, description, default_price)
VALUES ('Custom Service', 'Description', 99.99);
```

### Using Archive System

**Automatic archiving** runs when you click "Archive Old Orders"

Orders archived show:
- Created date
- Archived date
- All original details

**Unarchive**: Click unarchive icon to move back to active

## 💡 Benefits

### For Your Business
- ✅ More accurate profit tracking per service
- ✅ Better inventory management (parts per service)
- ✅ Cleaner active orders list
- ✅ Historical data in archive
- ✅ Faster order entry with catalog

### For Your Accounting
- Total Revenue = Sum of all (quantity × unit_price)
- COGS = Sum of all parts_cost
- Net Profit = Revenue - COGS
- Per-service profit visibility

## 🔄 Migration from Old Schema

If you have existing data, you'll need to:

1. **Run new schema** in Supabase SQL Editor
2. **Old orders will break** - this is a breaking change
3. **Recommended**: Start fresh with new schema
4. **Alternative**: Manually migrate old orders to new structure

## 📝 Updated Workflows

### Old Way
```
Order → One service description → Total costs
```

### New Way
```
Order → Multiple services → Each with quantity/price → Auto-calculated total
```

### Printing
Receipts and invoices now show:
- Itemized services
- Quantities
- Individual prices
- Service descriptions
- Professional layout

## 🎯 Next Steps

1. Run updated `database-schema.sql`
2. Explore the new Orders page
3. Try adding multi-service orders
4. Check out the Archive page
5. Customize service catalog for your shop

---

**Questions?** Check the main README.md for full documentation!
