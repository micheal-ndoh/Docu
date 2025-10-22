# 🔧 Quick Fix: Templates Not Showing

## 🐛 Problem

You uploaded a template successfully, but it doesn't appear in the templates list.

**Why?** The template was saved to DocuSeal but **not to your local database**.

---

## ✅ Solution (2 Steps)

### **Step 1: Run Database Migration**

You need to create the `Template` and `Submission` tables in your database.

**Run this command:**

```bash
npx prisma migrate dev --name add_user_template_submission_tracking
```

Or use the script:

```bash
./run-migration.sh
```

This will create the database tables needed to track templates and submissions.

---

### **Step 2: Restart Your App**

After the migration completes:

```bash
npm run dev
```

---

## 🎯 What Was Fixed

Updated **`/api/docuseal/templates/upload`** to save templates to the database:

```typescript
// After uploading to DocuSeal, save to local database
await prisma.template.create({
  data: {
    userId: userId,
    docusealId: data.id,
    name: data.name,
  },
});
```

---

## 🧪 Test It

1. **Run the migration** (Step 1 above)
2. **Restart your app** (Step 2 above)
3. **Upload a new template**
4. **Go to templates page** - Should now appear! ✅

---

## 📝 Note About Existing Template

The template you just uploaded (ID: 1995514) is in DocuSeal but not in your database.

**Two options:**

### Option A: Re-upload it
- Delete from DocuSeal (or leave it)
- Upload again after running migration
- Will now save to database

### Option B: Manually add it to database
After running migration, you can manually insert it:

```sql
INSERT INTO "Template" ("id", "userId", "docusealId", "name", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'WQXlN7M4WstXyffkuCRHJ3pTuCe2pb03',
  1995514,
  'Parental Consent Form',
  NOW(),
  NOW()
);
```

---

## ✅ Summary

**Issue:** Templates not saving to database  
**Cause:** Migration not run yet  
**Fix:** Run migration + restart app  
**Status:** Code is ready, just need to run migration!

---

**Run the migration now and you're good to go!** 🚀
