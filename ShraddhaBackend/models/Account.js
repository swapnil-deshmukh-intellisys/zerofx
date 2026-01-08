import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    // User reference
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Account details
    type: { type: String, required: true }, // e.g., "Standard", "Platinum", "Premium", "Demo"
    status: { type: String, required: true, enum: ['Live', 'Demo', 'LIVE', 'DEMO'] },
    accountNumber: { type: String, unique: true },
    
    // Financial data
    balance: { type: Number, default: 0.00 },
    currency: { type: String, default: '₹' },
    equity: { type: Number, default: 0.00 },
    margin: { type: Number, default: 0.00 },
    leverage: { type: String, default: '1:500' },
    
    // MT5 Trading Platform Details
    mt5Id: { type: String, default: '' },
    mt5Password: { type: String, default: '' },
    mt5Server: { type: String, default: '' },
    
    // Account settings
    initialDeposit: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    
    // Metadata
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Generate unique account number
accountSchema.pre('save', async function(next) {
  if (this.isNew && !this.accountNumber) {
    const prefix = (this.status === 'Demo' || this.status === 'DEMO') ? 'DEMO' : 'LIVE';
    let accountNumber;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      accountNumber = `${prefix}${randomNum}`;
      
      // Check if this account number already exists
      const existingAccount = await this.constructor.findOne({ accountNumber });
      if (!existingAccount) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (isUnique) {
      this.accountNumber = accountNumber;
    } else {
      // Fallback: use timestamp-based account number
      const timestamp = Date.now().toString().slice(-6);
      this.accountNumber = `${prefix}${timestamp}`;
    }
  }
  next();
});

const Account = mongoose.model("Account", accountSchema);
export default Account;
