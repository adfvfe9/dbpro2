package com.mirim.back;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cafes")
@Getter
@Setter
@NoArgsConstructor
public class Cafe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cafe_id")
    private Integer cafeId;

    @Column(name = "cafe_name", nullable = false, unique = true, length = 50)
    private String cafeName;

    public Cafe(String cafeName) {
        this.cafeName = cafeName;
    }
}
