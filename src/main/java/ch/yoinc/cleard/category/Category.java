package ch.yoinc.cleard.category;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 7)
    private String color;

    @Column(length = 10)
    private String direction;

    @Column(nullable = true, length = 40)
    private String warningThreshold;
}
