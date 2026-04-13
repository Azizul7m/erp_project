package api

import "strings"

var positionSalaryMap = map[string]float64{
	"general manager":    90000,
	"operations manager": 78000,
	"accountant":         52000,
	"hr executive":       45000,
	"sales executive":    42000,
	"warehouse officer":  36000,
	"support staff":      28000,
}

const defaultEmployeeSalary = 30000

func normalizeEmployeePosition(value string) string {
	trimmed := strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
	if trimmed == "" {
		return ""
	}

	lower := strings.ToLower(trimmed)
	for position := range positionSalaryMap {
		if lower == position {
			return titleWords(position)
		}
	}

	return titleWords(lower)
}

func salaryForPosition(position string) float64 {
	normalized := strings.ToLower(strings.TrimSpace(position))
	if salary, ok := positionSalaryMap[normalized]; ok {
		return salary
	}
	return defaultEmployeeSalary
}

func titleWords(value string) string {
	parts := strings.Fields(value)
	for index, part := range parts {
		if part == "" {
			continue
		}
		parts[index] = strings.ToUpper(part[:1]) + part[1:]
	}
	return strings.Join(parts, " ")
}
