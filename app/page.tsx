"use client";

import { FormEvent, useEffect, useState } from "react";

type TestResult = {
  ok: boolean;
  latencyMs?: number;
  error?: string;
  connection?: Record<string, unknown>;
  inserted?: Record<string, unknown>;
  totalRows?: number;
};

type Item = {
  id: string;
  message: string;
  created_at: string;
};

type ItemsResponse = {
  ok: boolean;
  items?: Item[];
  item?: Item;
  deletedId?: string;
  error?: string;
};

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers
    },
    cache: "no-store"
  });
  const data = (await response.json()) as T;

  if (!response.ok) {
    throw data;
  }

  return data;
}

async function requestTest(method: "GET" | "POST") {
  return requestJson<TestResult>("/api/db-test", { method });
}

export default function Home() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState("");
  const [isLoading, setIsLoading] = useState<"read" | "write" | "items" | "save" | null>(null);
  const [crudError, setCrudError] = useState<string | null>(null);

  async function loadItems() {
    setIsLoading("items");
    setCrudError(null);

    try {
      const data = await requestJson<ItemsResponse>("/api/items");
      setItems(data.items ?? []);
    } catch (error) {
      setCrudError((error as ItemsResponse).error ?? "Unable to load items");
    } finally {
      setIsLoading(null);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function runReadTest() {
    setIsLoading("read");
    setResult(null);

    try {
      setResult(await requestTest("GET"));
    } catch (error) {
      setResult(error as TestResult);
    } finally {
      setIsLoading(null);
    }
  }

  async function runWriteTest() {
    setIsLoading("write");
    setResult(null);

    try {
      setResult(await requestTest("POST"));
      await loadItems();
    } catch (error) {
      setResult(error as TestResult);
    } finally {
      setIsLoading(null);
    }
  }

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextMessage = message.trim();

    if (!nextMessage) {
      setCrudError("Please enter a message.");
      return;
    }

    setIsLoading("save");
    setCrudError(null);

    try {
      const data = await requestJson<ItemsResponse>("/api/items", {
        method: "POST",
        body: JSON.stringify({ message: nextMessage })
      });

      if (data.item) {
        setItems((current) => [data.item as Item, ...current]);
      }

      setMessage("");
    } catch (error) {
      setCrudError((error as ItemsResponse).error ?? "Unable to create item");
    } finally {
      setIsLoading(null);
    }
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditingMessage(item.message);
    setCrudError(null);
  }

  async function saveEdit(id: string) {
    const nextMessage = editingMessage.trim();

    if (!nextMessage) {
      setCrudError("Please enter a message.");
      return;
    }

    setIsLoading("save");
    setCrudError(null);

    try {
      const data = await requestJson<ItemsResponse>(`/api/items/${id}`, {
        method: "PUT",
        body: JSON.stringify({ message: nextMessage })
      });

      if (data.item) {
        setItems((current) => current.map((item) => (item.id === id ? (data.item as Item) : item)));
      }

      setEditingId(null);
      setEditingMessage("");
    } catch (error) {
      setCrudError((error as ItemsResponse).error ?? "Unable to update item");
    } finally {
      setIsLoading(null);
    }
  }

  async function deleteItem(id: string) {
    setIsLoading("save");
    setCrudError(null);

    try {
      await requestJson<ItemsResponse>(`/api/items/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      setCrudError((error as ItemsResponse).error ?? "Unable to delete item");
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <main className="shell">
      <section className="panel">
        <div>
          <p className="eyebrow">Plesk deployment check</p>
          <h1>Next.js + PostgreSQL CRUD</h1>
          <p className="lead">
            Test the database connection, then create, read, update, and delete rows in PostgreSQL.
          </p>
        </div>

        <div className="actions" aria-label="Database test actions">
          <button type="button" onClick={runReadTest} disabled={isLoading !== null}>
            {isLoading === "read" ? "Checking..." : "Test read"}
          </button>
          <button type="button" className="secondary" onClick={runWriteTest} disabled={isLoading !== null}>
            {isLoading === "write" ? "Writing..." : "Test write"}
          </button>
        </div>

        <div className={`status ${result?.ok ? "success" : result ? "error" : ""}`}>
          {result ? (
            <>
              <div className="statusHeader">
                <strong>{result.ok ? "Database connected" : "Database failed"}</strong>
                {typeof result.latencyMs === "number" ? <span>{result.latencyMs} ms</span> : null}
              </div>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </>
          ) : (
            <p>Use the buttons above to test the PostgreSQL connection.</p>
          )}
        </div>

        <section className="crud">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">Simple CRUD</p>
              <h2>Database rows</h2>
            </div>
            <button type="button" className="ghost" onClick={loadItems} disabled={isLoading !== null}>
              {isLoading === "items" ? "Loading..." : "Refresh"}
            </button>
          </div>

          <form className="createForm" onSubmit={createItem}>
            <input
              aria-label="New message"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type a message"
              value={message}
            />
            <button type="submit" disabled={isLoading !== null}>
              Add
            </button>
          </form>

          {crudError ? <p className="inlineError">{crudError}</p> : null}

          <div className="items">
            {items.length === 0 ? (
              <p className="empty">No rows yet. Add one above.</p>
            ) : (
              items.map((item) => (
                <article className="item" key={item.id}>
                  <div className="itemContent">
                    <span className="itemId">#{item.id}</span>
                    {editingId === item.id ? (
                      <input
                        aria-label={`Edit item ${item.id}`}
                        onChange={(event) => setEditingMessage(event.target.value)}
                        value={editingMessage}
                      />
                    ) : (
                      <p>{item.message}</p>
                    )}
                    <time>{item.created_at}</time>
                  </div>

                  <div className="itemActions">
                    {editingId === item.id ? (
                      <>
                        <button type="button" onClick={() => saveEdit(item.id)} disabled={isLoading !== null}>
                          Save
                        </button>
                        <button type="button" className="ghost" onClick={() => setEditingId(null)} disabled={isLoading !== null}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="ghost" onClick={() => startEdit(item)} disabled={isLoading !== null}>
                          Edit
                        </button>
                        <button type="button" className="danger" onClick={() => deleteItem(item.id)} disabled={isLoading !== null}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
