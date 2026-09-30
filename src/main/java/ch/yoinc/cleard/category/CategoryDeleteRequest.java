package ch.yoinc.cleard.category;

import java.util.List;

public record CategoryDeleteRequest(List<CategoryReassignment> reassignments) {
}
