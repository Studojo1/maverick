import { useState, useEffect, useRef } from "react";
import { FiSearch, FiPlus } from "react-icons/fi";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface CompanySelectorProps {
  value: string | null;
  onChange: (companyId: string | null, companyName: string) => void;
  onCreateNew?: (companyName: string) => Promise<Company>;
  /** Seed the visible input when there is no selected company id yet (e.g. an AI-extracted name). */
  initialName?: string;
}

export function CompanySelector({
  value,
  onChange,
  onCreateNew,
  initialName,
}: CompanySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  // Seed/select from an externally supplied name (e.g. AI-extracted) when
  // nothing is selected yet: auto-select an existing company if the name
  // matches, otherwise show the typed name (the server creates it on submit).
  useEffect(() => {
    if (value || !initialName) return;
    const match = companies.find(
      (c) => c.name.toLowerCase() === initialName.toLowerCase()
    );
    if (match) {
      setSelectedCompany(match);
      setSearchQuery(match.name);
      onChange(match.id, match.name);
    } else if (searchQuery.trim() === "") {
      setSearchQuery(initialName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialName, value, companies]);

  useEffect(() => {
    if (value && companies.length > 0) {
      const company = companies.find((c) => c.id === value);
      if (company) {
        setSelectedCompany(company);
        setSearchQuery(company.name);
      }
    }
  }, [value, companies]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCompanies(companies.slice(0, 10));
    } else {
      const filtered = companies.filter((company) =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCompanies(filtered.slice(0, 10));
    }
  }, [searchQuery, companies]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const token = await import("~/lib/api").then((m) => m.getToken());
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch("/api/companies", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load companies");
      }

      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error("Error loading companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setSearchQuery(company.name);
    setShowDropdown(false);
    onChange(company.id, company.name);
  };

  const handleCreateNew = async () => {
    if (!searchQuery.trim() || !onCreateNew) return;

    try {
      setCreatingNew(true);
      const newCompany = await onCreateNew(searchQuery.trim());
      setCompanies((prev) => [newCompany, ...prev]);
      handleSelectCompany(newCompany);
      toast.success("Company created successfully");
    } catch (error: any) {
      console.error("Error creating company:", error);
      toast.error(error.message || "Failed to create company");
    } finally {
      setCreatingNew(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
    if (selectedCompany && e.target.value !== selectedCompany.name) {
      setSelectedCompany(null);
      onChange(null, "");
    }
  };

  const showCreateOption =
    searchQuery.trim() !== "" &&
    !filteredCompanies.some(
      (c) => c.name.toLowerCase() === searchQuery.toLowerCase()
    ) &&
    onCreateNew;

  return (
    <div className="relative">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search or type to create new company..."
          className="w-full rounded-lg border-2 border-neutral-900 pl-10 pr-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border-2 border-neutral-900 bg-white shadow-lg"
        >
          {loading ? (
            <div className="p-4 text-center font-['Satoshi'] text-sm text-gray-600">
              Loading...
            </div>
          ) : filteredCompanies.length === 0 && !showCreateOption ? (
            <div className="p-4 text-center font-['Satoshi'] text-sm text-gray-600">
              No companies found
            </div>
          ) : (
            <>
              {filteredCompanies.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => handleSelectCompany(company)}
                  className={`w-full px-4 py-2 text-left font-['Satoshi'] text-sm transition-colors hover:bg-gray-100 ${
                    selectedCompany?.id === company.id
                      ? "bg-violet-50 text-violet-700"
                      : "text-neutral-900"
                  }`}
                >
                  {company.name}
                </button>
              ))}
              {showCreateOption && (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={creatingNew}
                  className="w-full border-t-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] text-sm text-violet-600 transition-colors hover:bg-violet-50 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <FiPlus className="h-4 w-4" />
                    {creatingNew
                      ? "Creating..."
                      : `Create "${searchQuery.trim()}"`}
                  </div>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

