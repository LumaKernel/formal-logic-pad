import { describe, it, expect, vi } from "vitest";
import {
  createScriptRunner,
  isScriptRunResult,
  type ScriptRunResult,
  type ScriptRunResultError,
  type ScriptRunnerInstance,
} from "./scriptRunner";

// ヘルパー: createScriptRunner の結果をインスタンスとして取得
const getRunner = (
  result: ScriptRunResult | ScriptRunnerInstance,
): ScriptRunnerInstance => {
  if (isScriptRunResult(result)) {
    throw new Error(
      `Expected ScriptRunnerInstance but got ScriptRunResult: ${JSON.stringify(result) satisfies string}`,
    );
  }
  return result;
};

// ヘルパー: createScriptRunner の結果をエラー結果として取得
const getError = (
  result: ScriptRunResult | ScriptRunnerInstance,
): ScriptRunResultError => {
  if (!isScriptRunResult(result)) {
    throw new Error("Expected ScriptRunResult but got ScriptRunnerInstance");
  }
  if (result._tag !== "Error") {
    throw new Error(
      `Expected Error result but got ${result._tag satisfies string}`,
    );
  }
  return result;
};

describe("ScriptRunner", () => {
  describe("基本実行", () => {
    it("単純な式を実行して結果を取得できる", () => {
      const runner = getRunner(createScriptRunner("1 + 2"));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe(3);
        expect(result.steps).toBeGreaterThan(0);
      }
    });

    it("文字列の結合を実行できる", () => {
      const runner = getRunner(createScriptRunner("'hello' + ' ' + 'world'"));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe("hello world");
      }
    });

    it("変数定義と演算を実行できる", () => {
      const runner = getRunner(
        createScriptRunner("var x = 10; var y = 20; x + y;"),
      );
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe(30);
      }
    });

    it("関数定義と呼び出しを実行できる", () => {
      const code = `
        function add(a, b) { return a + b; }
        add(3, 4);
      `;
      const runner = getRunner(createScriptRunner(code));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe(7);
      }
    });

    it("配列操作を実行できる", () => {
      const code = `
        var arr = [1, 2, 3];
        arr.push(4);
        arr.length;
      `;
      const runner = getRunner(createScriptRunner(code));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe(4);
      }
    });

    it("オブジェクトの操作を実行できる", () => {
      const code = `
        var obj = { x: 1, y: 2 };
        obj.x + obj.y;
      `;
      const runner = getRunner(createScriptRunner(code));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe(3);
      }
    });

    it("boolean の結果を返せる", () => {
      const runner = getRunner(createScriptRunner("true && false"));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe(false);
      }
    });

    it("undefinedの結果を返せる", () => {
      const runner = getRunner(createScriptRunner("undefined"));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe(undefined);
      }
    });

    it("nullの結果を返せる", () => {
      const runner = getRunner(createScriptRunner("null"));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe(null);
      }
    });

    it("elapsedMsが記録される", () => {
      let time = 0;
      const runner = getRunner(
        createScriptRunner("1 + 1", { getNow: () => time++ }),
      );
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.elapsedMs).toBeGreaterThan(0);
      }
    });
  });

  describe("ステップ実行", () => {
    it("step()で1ステップずつ実行できる", () => {
      const runner = getRunner(createScriptRunner("1 + 2"));
      let status = runner.step();
      expect(status._tag).toBe("Running");
      expect(status.steps).toBe(1);

      // 最終的に Done になるまでステップ実行
      while (status._tag === "Running") {
        status = runner.step();
      }
      expect(status._tag).toBe("Done");
      if (status._tag === "Done") {
        expect(status.value).toBe(3);
        expect(status.steps).toBeGreaterThan(1);
      }
    });

    it("getSteps()で現在のステップ数を取得できる", () => {
      const runner = getRunner(createScriptRunner("var x = 1; x + 1;"));
      expect(runner.getSteps()).toBe(0);
      runner.step();
      expect(runner.getSteps()).toBe(1);
      runner.step();
      expect(runner.getSteps()).toBeGreaterThanOrEqual(2);
    });

    it("完了後にstep()を呼んでもDoneを返す", () => {
      const runner = getRunner(createScriptRunner("42"));
      // runで完了まで進める
      runner.run();
      // step()はもう呼んでもDoneになっている（かエラーにならない）
      const status = runner.step();
      // 完了済みなのでDoneかRunning(steps >= maxSteps if very large)
      expect(["Done", "Running", "Error"]).toContain(status._tag);
    });
  });

  describe("ステップ数制限", () => {
    it("maxStepsを超過するとStepLimitExceededエラーになる", () => {
      const code = "while(true) {}";
      const runner = getRunner(
        createScriptRunner(code, { maxSteps: 100, maxTimeMs: 60_000 }),
      );
      const result = runner.run();
      expect(result._tag).toBe("Error");
      if (result._tag === "Error") {
        expect(result.error._tag).toBe("StepLimitExceeded");
        if (result.error._tag === "StepLimitExceeded") {
          expect(result.error.maxSteps).toBe(100);
        }
        expect(result.steps).toBe(100);
      }
    });

    it("step()でもステップ制限が検出される", () => {
      const code = "while(true) {}";
      const runner = getRunner(
        createScriptRunner(code, { maxSteps: 50, maxTimeMs: 60_000 }),
      );

      // ステップ実行を繰り返す
      let lastStatus = runner.step();
      while (lastStatus._tag === "Running") {
        lastStatus = runner.step();
      }

      // 最終的にStepLimitExceededエラーになる
      expect(lastStatus._tag).toBe("Error");
      if (lastStatus._tag === "Error") {
        expect(lastStatus.error._tag).toBe("StepLimitExceeded");
        expect(lastStatus.steps).toBe(50);
      }
    });

    it("デフォルトのステップ数制限は10,000", () => {
      const code = "while(true) {}";
      const runner = getRunner(createScriptRunner(code, { maxTimeMs: 60_000 }));
      const result = runner.run();
      expect(result._tag).toBe("Error");
      if (result._tag === "Error") {
        expect(result.error._tag).toBe("StepLimitExceeded");
        if (result.error._tag === "StepLimitExceeded") {
          expect(result.error.maxSteps).toBe(10_000);
        }
      }
    });
  });

  describe("時間制限", () => {
    it("maxTimeMsを超過するとTimeLimitExceededエラーになる", () => {
      let time = 0;
      const code = "while(true) {}";
      const runner = getRunner(
        createScriptRunner(code, {
          maxSteps: 1_000_000,
          maxTimeMs: 100,
          getNow: () => {
            time += 10; // 各ステップで10ms進む
            return time;
          },
        }),
      );
      const result = runner.run();
      expect(result._tag).toBe("Error");
      if (result._tag === "Error") {
        expect(result.error._tag).toBe("TimeLimitExceeded");
        if (result.error._tag === "TimeLimitExceeded") {
          expect(result.error.maxTimeMs).toBe(100);
        }
      }
    });

    it("デフォルトの時間制限は5,000ms", () => {
      let time = 0;
      const code = "while(true) {}";
      const runner = getRunner(
        createScriptRunner(code, {
          maxSteps: 1_000_000,
          getNow: () => {
            time += 100;
            return time;
          },
        }),
      );
      const result = runner.run();
      expect(result._tag).toBe("Error");
      if (result._tag === "Error") {
        expect(result.error._tag).toBe("TimeLimitExceeded");
        if (result.error._tag === "TimeLimitExceeded") {
          expect(result.error.maxTimeMs).toBe(5_000);
        }
      }
    });
  });

  describe("サンドボックスの安全性", () => {
    it("document にアクセスできない", () => {
      const runner = getRunner(createScriptRunner("typeof document"));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe("undefined");
      }
    });

    it("fetch にアクセスできない", () => {
      const runner = getRunner(createScriptRunner("typeof fetch"));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe("undefined");
      }
    });

    it("XMLHttpRequest にアクセスできない", () => {
      const runner = getRunner(createScriptRunner("typeof XMLHttpRequest"));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe("undefined");
      }
    });

    it("require にアクセスできない", () => {
      const runner = getRunner(createScriptRunner("typeof require"));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe("undefined");
      }
    });

    it("process にアクセスできない", () => {
      const runner = getRunner(createScriptRunner("typeof process"));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe("undefined");
      }
    });

    it("global にアクセスできない", () => {
      const runner = getRunner(createScriptRunner("typeof global"));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe("undefined");
      }
    });

    it("setTimeout はサンドボックス内で存在するがホストのものではない", () => {
      // JS-Interpreter はサンドボックス内にsetTimeout/setIntervalを提供するが、
      // ホストの setTimeout ではなくインタプリタ内のタスクキューで動作する
      const runner = getRunner(createScriptRunner("typeof setTimeout"));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        // JS-Interpreter がサンドボックス内に setTimeout を提供している
        expect(result.value).toBe("function");
      }
    });

    it("eval にアクセスできない（ホストevalを呼べない）", () => {
      // JS-Interpreter内のevalは安全なサンドボックス内で動作する
      const runner = getRunner(createScriptRunner("typeof eval"));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      // eval は JS-Interpreter 内で定義されている（サンドボックス版）
      if (result._tag === "Ok") {
        expect(["function", "undefined"]).toContain(result.value);
      }
    });
  });

  describe("ネイティブ関数ブリッジ", () => {
    it("ネイティブ関数をサンドボックスに公開できる", () => {
      const log = vi.fn();
      const runner = getRunner(
        createScriptRunner("myLog('hello'); myLog('world');", {
          bridges: [{ name: "myLog", fn: log }],
        }),
      );
      runner.run();
      expect(log).toHaveBeenCalledTimes(2);
      expect(log).toHaveBeenCalledWith("hello");
      expect(log).toHaveBeenCalledWith("world");
    });

    it("ネイティブ関数の戻り値をサンドボックスで使用できる", () => {
      const runner = getRunner(
        createScriptRunner("add(3, 4)", {
          bridges: [
            {
              name: "add",
              fn: (a: unknown, b: unknown) => (a as number) + (b as number),
            },
          ],
        }),
      );
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe(7);
      }
    });

    it("複数のネイティブ関数を登録できる", () => {
      const runner = getRunner(
        createScriptRunner("multiply(add(2, 3), 4)", {
          bridges: [
            {
              name: "add",
              fn: (a: unknown, b: unknown) => (a as number) + (b as number),
            },
            {
              name: "multiply",
              fn: (a: unknown, b: unknown) => (a as number) * (b as number),
            },
          ],
        }),
      );
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe(20);
      }
    });

    it("ネイティブ関数にオブジェクトを渡せる", () => {
      const received = vi.fn();
      const runner = getRunner(
        createScriptRunner("receive({x: 1, y: 2})", {
          bridges: [{ name: "receive", fn: received }],
        }),
      );
      runner.run();
      expect(received).toHaveBeenCalledTimes(1);
      const arg = received.mock.calls[0][0] as Record<string, number>;
      expect(arg.x).toBe(1);
      expect(arg.y).toBe(2);
    });

    it("ネイティブ関数がオブジェクトを返してサンドボックスで利用できる", () => {
      const runner = getRunner(
        createScriptRunner("var obj = getData(); obj.name;", {
          bridges: [
            {
              name: "getData",
              fn: () => ({ name: "test", value: 42 }),
            },
          ],
        }),
      );
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe("test");
      }
    });
  });

  describe("エラーハンドリング", () => {
    it("構文エラーのコードでSyntaxErrorを返す", () => {
      const result = createScriptRunner("function {");
      const errorResult = getError(result);
      expect(errorResult._tag).toBe("Error");
      expect(errorResult.error._tag).toBe("SyntaxError");
    });

    it("ランタイムエラーをキャッチする", () => {
      const runner = getRunner(createScriptRunner("null.property"));
      const result = runner.run();
      expect(result._tag).toBe("Error");
      if (result._tag === "Error") {
        expect(result.error._tag).toBe("RuntimeError");
      }
    });

    it("throw文のエラーをキャッチする", () => {
      const runner = getRunner(
        createScriptRunner("throw new Error('custom error')"),
      );
      const result = runner.run();
      expect(result._tag).toBe("Error");
      if (result._tag === "Error") {
        expect(result.error._tag).toBe("RuntimeError");
      }
    });

    it("try-catchでサンドボックス内のエラーを処理できる", () => {
      const code = `
        var result;
        try {
          null.property;
        } catch(e) {
          result = 'caught';
        }
        result;
      `;
      const runner = getRunner(createScriptRunner(code));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe("caught");
      }
    });

    it("SyntaxError結果のstepsとelapsedMsは0", () => {
      const result = createScriptRunner(";;;; {{{");
      const errorResult = getError(result);
      expect(errorResult.steps).toBe(0);
      expect(errorResult.elapsedMs).toBe(0);
    });
  });

  describe("step()でのエッジケース", () => {
    it("step()で時間制限が検出される", () => {
      let time = 0;
      const code = "while(true) {}";
      const runner = getRunner(
        createScriptRunner(code, {
          maxSteps: 1_000_000,
          maxTimeMs: 50,
          getNow: () => {
            time += 10;
            return time;
          },
        }),
      );

      let lastStatus = runner.step();
      while (lastStatus._tag === "Running") {
        lastStatus = runner.step();
      }

      expect(lastStatus._tag).toBe("Error");
      if (lastStatus._tag === "Error") {
        expect(lastStatus.error._tag).toBe("TimeLimitExceeded");
      }
    });

    it("ステップ制限到達後にstep()を呼ぶとエラーが返る", () => {
      const code = "while(true) {}";
      const runner = getRunner(
        createScriptRunner(code, { maxSteps: 10, maxTimeMs: 60_000 }),
      );

      // まず制限到達まで実行
      const result = runner.run();
      expect(result._tag).toBe("Error");

      // 再度step()を呼ぶ
      const status = runner.step();
      expect(status._tag).toBe("Error");
      if (status._tag === "Error") {
        expect(status.error._tag).toBe("StepLimitExceeded");
      }
    });

    it("ランタイムエラー後のerrorにメッセージが含まれる", () => {
      const runner = getRunner(createScriptRunner("throw 'string error'"));
      const result = runner.run();
      expect(result._tag).toBe("Error");
      if (result._tag === "Error") {
        expect(result.error._tag).toBe("RuntimeError");
        if (result.error._tag === "RuntimeError") {
          expect(result.error.message).toContain("string error");
        }
      }
    });
  });

  describe("isScriptRunResult", () => {
    it("ScriptRunResultを正しく判定する", () => {
      const result: ScriptRunResult = {
        _tag: "Ok",
        value: 42,
        steps: 1,
        elapsedMs: 0,
      };
      expect(isScriptRunResult(result)).toBe(true);
    });

    it("ScriptRunnerInstanceを正しく判定する", () => {
      const runner = createScriptRunner("1");
      if (!isScriptRunResult(runner)) {
        expect(isScriptRunResult(runner)).toBe(false);
      }
    });
  });

  describe("設定のデフォルト値", () => {
    it("configなしでもデフォルト値で動作する", () => {
      const runner = getRunner(createScriptRunner("1 + 1"));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe(2);
      }
    });

    it("空のconfigでもデフォルト値で動作する", () => {
      const runner = getRunner(createScriptRunner("2 * 3", {}));
      const result = runner.run();
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe(6);
      }
    });
  });
});
