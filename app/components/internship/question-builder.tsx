import { useState } from "react";
import { FiPlus, FiX, FiChevronUp, FiChevronDown, FiSearch } from "react-icons/fi";
import { getToken } from "~/lib/api";
import { toast } from "sonner";

export type QuestionType = "text" | "textarea" | "multiple_choice" | "checkbox" | "file_upload" | "date" | "number" | "rating" | "yes_no";

export interface Question {
  id?: string;
  question_text: string;
  question_type: QuestionType;
  options?: string[];
  required: boolean;
  order: number;
  tag_id?: string | null;
}

interface QuestionBuilderProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

export function QuestionBuilder({ questions, onChange }: QuestionBuilderProps) {
  const [matchingQuestion, setMatchingQuestion] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  const addQuestion = () => {
    const newQuestion: Question = {
      question_text: "",
      question_type: "text",
      required: false,
      order: questions.length,
    };
    onChange([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i }));
    onChange(newQuestions);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    onChange(newQuestions);
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === questions.length - 1) return;

    const newQuestions = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    
    // Update order
    newQuestions.forEach((q, i) => {
      q.order = i;
    });
    
    onChange(newQuestions);
  };

  const handleMatchQuestion = async (index: number) => {
    const question = questions[index];
    if (!question.question_text.trim()) {
      toast.error("Please enter question text first");
      return;
    }

    setMatchingQuestion(question.question_text);
    setMatchingLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/questions/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question_text: question.question_text }),
      });

      if (!response.ok) {
        throw new Error("Failed to match questions");
      }

      const data = await response.json();
      setMatchResults(data.matches || []);
    } catch (error) {
      console.error("Error matching questions:", error);
      toast.error("Failed to match questions");
    } finally {
      setMatchingLoading(false);
    }
  };

  const useMatchedQuestion = (matchedQuestion: any, index: number) => {
    updateQuestion(index, {
      question_text: matchedQuestion.question_text,
      question_type: matchedQuestion.question_type,
      options: matchedQuestion.options,
      tag_id: matchedQuestion.tag_id,
    });
    setMatchResults([]);
    setMatchingQuestion(null);
    toast.success("Question matched and filled");
  };

  const addOption = (index: number) => {
    const question = questions[index];
    const newOptions = [...(question.options || []), ""];
    updateQuestion(index, { options: newOptions });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = questions[questionIndex];
    const newOptions = [...(question.options || [])];
    newOptions[optionIndex] = value;
    updateQuestion(questionIndex, { options: newOptions });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    const newOptions = (question.options || []).filter((_, i) => i !== optionIndex);
    updateQuestion(questionIndex, { options: newOptions });
  };

  const questionTypes: { value: QuestionType; label: string }[] = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Textarea" },
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "checkbox", label: "Checkbox" },
    { value: "file_upload", label: "File Upload" },
    { value: "date", label: "Date" },
    { value: "number", label: "Number" },
    { value: "rating", label: "Rating" },
    { value: "yes_no", label: "Yes/No" },
  ];

  const needsOptions = (type: QuestionType) => {
    return type === "multiple_choice" || type === "checkbox" || type === "rating";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-['Clash_Display'] text-xl font-bold text-neutral-900">
          Application Questions
        </h3>
        <button
          type="button"
          onClick={addQuestion}
          className="flex items-center gap-2 rounded-lg border-2 border-neutral-900 bg-violet-600 px-4 py-2 font-['Satoshi'] font-medium text-white transition-colors hover:bg-violet-700"
        >
          <FiPlus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {questions.length === 0 && (
        <p className="font-['Satoshi'] text-gray-500">
          No questions added yet. Click "Add Question" to get started.
        </p>
      )}

      {questions.map((question, index) => (
        <div
          key={index}
          className="rounded-lg border-2 border-neutral-900 bg-white p-4"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <div>
                <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
                  Question Text *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={question.question_text}
                    onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
                    placeholder="Enter your question..."
                    className="flex-1 rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleMatchQuestion(index)}
                    disabled={matchingLoading || !question.question_text.trim()}
                    className="rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi'] font-medium text-neutral-900 transition-colors hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Match similar questions"
                  >
                    <FiSearch className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
                    Question Type *
                  </label>
                  <select
                    value={question.question_type}
                    onChange={(e) => {
                      const newType = e.target.value as QuestionType;
                      const updates: Partial<Question> = { question_type: newType };
                      if (!needsOptions(newType)) {
                        updates.options = undefined;
                      } else if (!question.options || question.options.length === 0) {
                        updates.options = [""];
                      }
                      updateQuestion(index, updates);
                    }}
                    className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {questionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 font-['Satoshi'] text-neutral-900">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                      className="h-4 w-4 text-violet-600 focus:ring-violet-500"
                    />
                    Required
                  </label>
                </div>
              </div>

              {needsOptions(question.question_type) && (
                <div>
                  <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
                    Options *
                  </label>
                  <div className="space-y-2">
                    {(question.options || []).map((option, optionIndex) => (
                      <div key={optionIndex} className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="flex-1 rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(index, optionIndex)}
                          className="rounded-lg border-2 border-neutral-900 bg-white px-3 py-2 font-['Satoshi'] text-red-600 transition-colors hover:bg-red-50"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(index)}
                      className="rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi'] font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
                    >
                      <FiPlus className="mr-2 inline w-4 h-4" />
                      Add Option
                    </button>
                  </div>
                </div>
              )}

              {matchingQuestion === question.question_text && matchResults.length > 0 && (
                <div className="rounded-lg border-2 border-violet-300 bg-violet-50 p-4">
                  <h4 className="mb-2 font-['Satoshi'] font-bold text-neutral-900">
                    Similar Questions Found:
                  </h4>
                  <div className="space-y-2">
                    {matchResults.map((match, matchIndex) => (
                      <div
                        key={matchIndex}
                        className="flex items-center justify-between rounded-lg border border-violet-200 bg-white p-3"
                      >
                        <div className="flex-1">
                          <p className="font-['Satoshi'] text-sm text-neutral-900">
                            {match.question_text}
                          </p>
                          <p className="font-['Satoshi'] text-xs text-gray-500">
                            Similarity: {Math.round(match.similarity * 100)}%
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => useMatchedQuestion(match, index)}
                          className="ml-4 rounded-lg border-2 border-violet-600 bg-violet-600 px-3 py-1 font-['Satoshi'] text-sm font-medium text-white transition-colors hover:bg-violet-700"
                        >
                          Use
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => moveQuestion(index, "up")}
                disabled={index === 0}
                className="rounded-lg border-2 border-neutral-900 bg-white p-2 text-neutral-900 transition-colors hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Move up"
              >
                <FiChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => moveQuestion(index, "down")}
                disabled={index === questions.length - 1}
                className="rounded-lg border-2 border-neutral-900 bg-white p-2 text-neutral-900 transition-colors hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Move down"
              >
                <FiChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                className="rounded-lg border-2 border-red-600 bg-white p-2 text-red-600 transition-colors hover:bg-red-50"
                title="Remove question"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

