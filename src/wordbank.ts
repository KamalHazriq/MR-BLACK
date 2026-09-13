import { DurableObject } from "cloudflare:workers";
import { WORD_PAIRS, wordPairId } from "./words";

export interface BankPair {
  id: string;
  civilian: string;
  undercover: string;
  category: string;
  difficulty: string;
  builtin: number;
  [key: string]: string | number;
}

interface Env {
  ADMIN_PIN?: string;
}

const DIFFICULTIES = new Set(["easy", "medium", "hard"]);

function clean(value: unknown, max = 60): string {
  return String(value ?? "").trim().slice(0, max);
}

// One global instance holds the live word bank: the built-in pairs seeded on
// first run, plus whatever the admin has since added, edited or removed.
export class WordBank extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => this.init());
  }

  private init() {
    const sql = this.ctx.storage.sql;
    sql.exec(`
      CREATE TABLE IF NOT EXISTS pairs (
        id TEXT PRIMARY KEY,
        civilian TEXT NOT NULL,
        undercover TEXT NOT NULL,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        builtin INTEGER NOT NULL DEFAULT 0
      )
    `);
    sql.exec(`CREATE TABLE IF NOT EXISTS categories (name TEXT PRIMARY KEY)`);

    const count = sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM pairs").one().n;
    if (count === 0) this.seedBuiltins();
  }

  private seedBuiltins() {
    const sql = this.ctx.storage.sql;
    WORD_PAIRS.forEach((p, i) => {
      sql.exec(
        "INSERT OR IGNORE INTO pairs (id, civilian, undercover, category, difficulty, builtin) VALUES (?, ?, ?, ?, ?, 1)",
        `b${wordPairId(i)}`,
        p.civilian,
        p.undercover,
        p.category,
        p.difficulty
      );
      sql.exec("INSERT OR IGNORE INTO categories (name) VALUES (?)", p.category);
    });
  }

  async list(): Promise<{ pairs: BankPair[]; categories: string[] }> {
    const sql = this.ctx.storage.sql;
    const pairs = sql
      .exec<BankPair>("SELECT id, civilian, undercover, category, difficulty, builtin FROM pairs")
      .toArray();
    const categories = sql
      .exec<{ name: string }>("SELECT name FROM categories ORDER BY name")
      .toArray()
      .map((r) => r.name);
    return { pairs, categories };
  }

  async addPair(input: { civilian: string; undercover: string; category: string; difficulty: string }): Promise<BankPair> {
    const civilian = clean(input.civilian, 40);
    const undercover = clean(input.undercover, 40);
    const category = clean(input.category, 40);
    const difficulty = DIFFICULTIES.has(input.difficulty) ? input.difficulty : "hard";
    if (!civilian || !undercover || !category) throw new Error("Civilian, undercover and category are required");

    const id = `c${crypto.randomUUID()}`;
    this.ctx.storage.sql.exec(
      "INSERT INTO pairs (id, civilian, undercover, category, difficulty, builtin) VALUES (?, ?, ?, ?, ?, 0)",
      id,
      civilian,
      undercover,
      category,
      difficulty
    );
    this.ctx.storage.sql.exec("INSERT OR IGNORE INTO categories (name) VALUES (?)", category);
    return { id, civilian, undercover, category, difficulty, builtin: 0 };
  }

  async updatePair(id: string, input: { civilian: string; undercover: string; category: string; difficulty: string }): Promise<void> {
    const civilian = clean(input.civilian, 40);
    const undercover = clean(input.undercover, 40);
    const category = clean(input.category, 40);
    const difficulty = DIFFICULTIES.has(input.difficulty) ? input.difficulty : "hard";
    if (!civilian || !undercover || !category) throw new Error("Civilian, undercover and category are required");

    this.ctx.storage.sql.exec(
      "UPDATE pairs SET civilian = ?, undercover = ?, category = ?, difficulty = ? WHERE id = ?",
      civilian,
      undercover,
      category,
      difficulty,
      clean(id, 80)
    );
    this.ctx.storage.sql.exec("INSERT OR IGNORE INTO categories (name) VALUES (?)", category);
  }

  async deletePair(id: string): Promise<void> {
    this.ctx.storage.sql.exec("DELETE FROM pairs WHERE id = ?", clean(id, 80));
  }

  async addCategory(name: string): Promise<void> {
    const category = clean(name, 40);
    if (!category) throw new Error("Category name is required");
    this.ctx.storage.sql.exec("INSERT OR IGNORE INTO categories (name) VALUES (?)", category);
  }

  async deleteCategory(name: string): Promise<void> {
    const category = clean(name, 40);
    this.ctx.storage.sql.exec("DELETE FROM pairs WHERE category = ?", category);
    this.ctx.storage.sql.exec("DELETE FROM categories WHERE name = ?", category);
  }

  async renameCategory(from: string, to: string): Promise<void> {
    const oldName = clean(from, 40);
    const newName = clean(to, 40);
    if (!newName) throw new Error("New category name is required");
    this.ctx.storage.sql.exec("UPDATE pairs SET category = ? WHERE category = ?", newName, oldName);
    this.ctx.storage.sql.exec("INSERT OR IGNORE INTO categories (name) VALUES (?)", newName);
    this.ctx.storage.sql.exec("DELETE FROM categories WHERE name = ?", oldName);
  }

  // Re-adds any built-in pair that was deleted, without touching custom ones.
  async restoreBuiltins(): Promise<number> {
    const before = this.ctx.storage.sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM pairs").one().n;
    this.seedBuiltins();
    const after = this.ctx.storage.sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM pairs").one().n;
    return after - before;
  }
}
